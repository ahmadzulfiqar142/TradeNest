-- ============================================================
-- Inventory & Sales Data Integrity Overhaul
-- Tickets: 04, 07, 08, 09, 10
-- ============================================================

-- ── TICKET-04: Widen inventory_transactions.quantity to DECIMAL(14,3) ──────
-- Widening a numeric type is additive and backward-compatible.
ALTER TABLE inventory_transactions
  ALTER COLUMN quantity TYPE DECIMAL(14,3),
  ALTER COLUMN previous_stock TYPE DECIMAL(14,3),
  ALTER COLUMN new_stock TYPE DECIMAL(14,3);

-- ── TICKET-10: Base unit schema — enforce exactly one base unit per product ─

-- Add is_base_unit column (separate from is_default which is a display concern)
ALTER TABLE product_units
  ADD COLUMN IF NOT EXISTS is_base_unit BOOLEAN NOT NULL DEFAULT FALSE;

-- Exactly one base unit per product
CREATE UNIQUE INDEX IF NOT EXISTS product_units_one_base_per_product
  ON product_units(product_id) WHERE is_base_unit;

-- The base unit's conversion_factor must always be 1
ALTER TABLE product_units
  DROP CONSTRAINT IF EXISTS base_unit_factor_is_one;
ALTER TABLE product_units
  ADD CONSTRAINT base_unit_factor_is_one
  CHECK (NOT is_base_unit OR conversion_factor = 1);

-- Backfill: mark the row with conversion_factor = 1 as the base unit for
-- existing products. If no such row exists, mark the default unit as base.
UPDATE product_units pu
SET is_base_unit = TRUE
WHERE pu.conversion_factor = 1
  AND NOT EXISTS (
    SELECT 1 FROM product_units pu2
    WHERE pu2.product_id = pu.product_id AND pu2.is_base_unit = TRUE
  );

-- Fallback: if still no base unit (no row with factor=1), use the default unit
UPDATE product_units pu
SET is_base_unit = TRUE
WHERE pu.is_default = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM product_units pu2
    WHERE pu2.product_id = pu.product_id AND pu2.is_base_unit = TRUE
  );

-- Trigger: keep inventory.base_unit_id in sync with the product's base unit row
CREATE OR REPLACE FUNCTION sync_inventory_base_unit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_workspace_id UUID;
BEGIN
  IF NEW.is_base_unit IS NOT TRUE THEN RETURN NEW; END IF;
  SELECT workspace_id INTO v_workspace_id FROM products WHERE id = NEW.product_id;
  UPDATE inventory
    SET base_unit_id = NEW.unit_id, updated_at = NOW()
  WHERE workspace_id = v_workspace_id AND product_id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_units_sync_base_unit ON product_units;
CREATE TRIGGER product_units_sync_base_unit
AFTER INSERT OR UPDATE OF unit_id, is_base_unit ON product_units
FOR EACH ROW EXECUTE FUNCTION sync_inventory_base_unit();

-- ── TICKET-08: Consolidate stock source — rename legacy column ──────────────
-- Rename products.stock_quantity → stock_quantity_legacy so any missed reads
-- fail loudly during transition rather than silently reading stale data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity_legacy'
  ) THEN
    ALTER TABLE products RENAME COLUMN stock_quantity TO stock_quantity_legacy;
  END IF;
END $$;

-- Update adjust_inventory RPC to write only to inventory.current_stock
-- (no longer mirrors to products.stock_quantity_legacy)
-- Also adds FOR UPDATE row-locking (TICKET-09) — already present, confirmed here.
CREATE OR REPLACE FUNCTION adjust_inventory(
  p_workspace_id UUID,
  p_product_id   UUID,
  p_direction    TEXT,
  p_quantity     NUMERIC,
  p_reason       TEXT,
  p_user_id      UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inventory    inventory%ROWTYPE;
  v_delta        NUMERIC;
  v_new_stock    NUMERIC;
  v_transaction_id UUID;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;
  IF p_reason IS NULL OR BTRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'An adjustment reason is required';
  END IF;
  IF p_direction NOT IN ('increase', 'decrease') THEN
    RAISE EXCEPTION 'Adjustment type must be increase or decrease';
  END IF;

  -- TICKET-09: row-level lock prevents concurrent adjustments on same product
  SELECT * INTO v_inventory FROM inventory
  WHERE workspace_id = p_workspace_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for this product';
  END IF;

  v_delta     := CASE WHEN p_direction = 'increase' THEN p_quantity ELSE -p_quantity END;
  v_new_stock := v_inventory.current_stock + v_delta;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot become negative';
  END IF;

  -- Single source of truth: inventory only
  UPDATE inventory
    SET current_stock = v_new_stock, updated_at = NOW()
  WHERE id = v_inventory.id;

  INSERT INTO inventory_transactions (
    inventory_id, workspace_id, product_id,
    transaction_type, quantity, previous_stock, new_stock,
    reference_type, notes, created_by
  ) VALUES (
    v_inventory.id, p_workspace_id, p_product_id,
    'adjustment', v_delta, v_inventory.current_stock, v_new_stock,
    'adjustment', BTRIM(p_reason), p_user_id
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- ── TICKET-07 + 08 + 09: Atomic cancel_sale_transaction RPC ─────────────────
-- Replaces the non-atomic per-item loop in cancelSale server action.
-- Restores stock to inventory.current_stock (not legacy column) with row locking.
CREATE OR REPLACE FUNCTION cancel_sale_transaction(
  p_workspace_id UUID,
  p_sale_id      UUID,
  p_user_id      UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sale        RECORD;
  v_item        RECORD;
  v_inventory   inventory%ROWTYPE;
  v_new_stock   NUMERIC;
BEGIN
  -- Fetch and validate sale
  SELECT id, status, invoice_number
    INTO v_sale
    FROM sales
   WHERE id = p_sale_id AND workspace_id = p_workspace_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;
  IF v_sale.status = 'cancelled' THEN
    RAISE EXCEPTION 'Sale is already cancelled';
  END IF;

  -- Restore stock for each product item (TICKET-09: lock inventory rows first)
  FOR v_item IN
    SELECT si.product_id, si.quantity, si.product_unit_id
      FROM sale_items si
     WHERE si.sale_id = p_sale_id
       AND si.product_id IS NOT NULL
  LOOP
    -- TICKET-09: row-level lock on inventory row
    SELECT * INTO v_inventory FROM inventory
    WHERE workspace_id = p_workspace_id AND product_id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN CONTINUE; END IF;

    -- TICKET-08: restore to inventory.current_stock (single source of truth)
    -- TICKET-09 + 12: apply conversion factor if a product_unit_id is present
    DECLARE
      v_conversion NUMERIC := 1;
      v_base_qty   NUMERIC;
      v_has_batches BOOLEAN;
      v_batch_rec  RECORD;
      v_to_restore NUMERIC;
      v_batch_restore NUMERIC;
    BEGIN
      IF v_item.product_unit_id IS NOT NULL THEN
        SELECT conversion_factor INTO v_conversion
          FROM product_units
         WHERE id = v_item.product_unit_id;
        v_conversion := COALESCE(v_conversion, 1);
      END IF;

      v_base_qty  := v_item.quantity * v_conversion;
      v_new_stock := v_inventory.current_stock + v_base_qty;

      UPDATE inventory
        SET current_stock = v_new_stock, updated_at = NOW()
      WHERE id = v_inventory.id;

      INSERT INTO inventory_transactions (
        inventory_id, workspace_id, product_id,
        transaction_type, quantity, previous_stock, new_stock,
        reference_type, reference_id, notes, created_by
      ) VALUES (
        v_inventory.id, p_workspace_id, v_item.product_id,
        'in', v_base_qty, v_inventory.current_stock, v_new_stock,
        'sale_cancel', p_sale_id,
        'Cancelled: ' || v_sale.invoice_number,
        p_user_id
      );

      -- Restore batch quantities (reverse FEFO: latest expiry first)
      SELECT EXISTS (
        SELECT 1 FROM product_batches
        WHERE workspace_id = p_workspace_id AND product_id = v_item.product_id
      ) INTO v_has_batches;

      IF v_has_batches THEN
        v_to_restore := v_base_qty;
        FOR v_batch_rec IN
          SELECT id, quantity_received, quantity_remaining
            FROM product_batches
           WHERE workspace_id = p_workspace_id
             AND product_id   = v_item.product_id
           ORDER BY expiry_date DESC NULLS FIRST, received_date DESC
        LOOP
          EXIT WHEN v_to_restore <= 0;
          -- Only restore up to what was originally received
          v_batch_restore := LEAST(
            v_to_restore,
            v_batch_rec.quantity_received - v_batch_rec.quantity_remaining
          );
          IF v_batch_restore > 0 THEN
            UPDATE product_batches
              SET quantity_remaining = quantity_remaining + v_batch_restore
            WHERE id = v_batch_rec.id;
            v_to_restore := v_to_restore - v_batch_restore;
          END IF;
        END LOOP;
      END IF;
    END;
  END LOOP;

  -- Mark sale as cancelled atomically
  UPDATE sales
    SET status = 'cancelled', payment_status = 'pending', updated_at = NOW()
  WHERE id = p_sale_id AND workspace_id = p_workspace_id;
END;
$$;

-- ── TICKET-08 + 09: Update create_sale_transaction to use inventory as source ─
-- Rewrite stock deduction to write inventory.current_stock (not products.stock_quantity_legacy)
-- and apply conversion_factor formula (TICKET-12).
CREATE OR REPLACE FUNCTION create_sale_transaction(
  p_workspace_id   UUID,
  p_user_id        UUID,
  p_invoice_number TEXT,
  p_customer_id    UUID,
  p_subtotal       NUMERIC,
  p_discount       NUMERIC,
  p_total          NUMERIC,
  p_paid_amount    NUMERIC,
  p_remaining      NUMERIC,
  p_status         TEXT,
  p_notes          TEXT,
  p_sale_date      DATE,
  p_payment_method TEXT,
  p_items          JSONB
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sale_id          UUID;
  v_payment_id       UUID;
  v_item             JSONB;
  v_product_id       UUID;
  v_inventory        inventory%ROWTYPE;
  v_conversion       NUMERIC;
  v_base_qty         NUMERIC;
  v_new_stock        NUMERIC;
  v_advance          NUMERIC := 0;
  v_applied          NUMERIC := 0;
  v_effective_paid   NUMERIC;
  v_effective_rem    NUMERIC;
  v_effective_status TEXT;
BEGIN
  -- ── 1. Stock validation with row-level locking (TICKET-09) ───────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    CONTINUE WHEN (v_item->>'type') = 'one_time'
               OR (v_item->>'productId') IS NULL
               OR (v_item->>'productId') = '';

    v_product_id := (v_item->>'productId')::UUID;

    -- TICKET-09: lock the inventory row to prevent overselling
    SELECT * INTO v_inventory FROM inventory
    WHERE workspace_id = p_workspace_id AND product_id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Inventory record not found for product: %', v_product_id;
    END IF;

    -- TICKET-12: apply conversion formula
    v_conversion := 1;
    IF (v_item->>'productUnitId') IS NOT NULL AND (v_item->>'productUnitId') <> '' THEN
      SELECT conversion_factor INTO v_conversion
        FROM product_units WHERE id = (v_item->>'productUnitId')::UUID;
      v_conversion := COALESCE(v_conversion, 1);
    END IF;

    v_base_qty := (v_item->>'quantity')::NUMERIC * v_conversion;

    IF v_inventory.current_stock < v_base_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: % (in base units)',
        (v_item->>'productName'), v_inventory.current_stock, v_base_qty;
    END IF;
  END LOOP;

  -- ── 2. Resolve advance balance ────────────────────────────────────────────
  IF p_customer_id IS NOT NULL AND p_remaining > 0 THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_advance
      FROM payments
     WHERE workspace_id = p_workspace_id
       AND customer_id  = p_customer_id
       AND sale_id IS NULL
       AND deleted_at IS NULL;

    IF v_advance > 0 THEN
      v_applied := LEAST(v_advance, p_remaining);
    END IF;
  END IF;

  v_effective_paid   := p_paid_amount + v_applied;
  v_effective_rem    := GREATEST(0, p_total - v_effective_paid);
  v_effective_status := CASE
    WHEN v_effective_paid <= 0       THEN 'pending'
    WHEN v_effective_paid >= p_total THEN 'paid'
    ELSE                                  'partially_paid'
  END;

  -- ── 3. Insert sale ────────────────────────────────────────────────────────
  INSERT INTO sales (
    workspace_id, invoice_number, customer_id,
    subtotal, discount, tax, total,
    paid_amount, remaining_amount, status,
    notes, sale_date, created_by
  ) VALUES (
    p_workspace_id, p_invoice_number, p_customer_id,
    p_subtotal, p_discount, 0, p_total,
    v_effective_paid, v_effective_rem, v_effective_status::sale_status,
    p_notes, p_sale_date, p_user_id
  )
  RETURNING id INTO v_sale_id;

  -- ── 4. Insert items + deduct stock (TICKET-08 + 12) ──────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    -- One-time line items: no product FK, no stock deduction
    IF (v_item->>'type') = 'one_time'
       OR (v_item->>'productId') IS NULL
       OR (v_item->>'productId') = ''
    THEN
      INSERT INTO sale_items (
        workspace_id, sale_id, product_id, product_name,
        quantity, unit_price, discount, tax, total, item_type,
        product_unit_id, unit_name
      ) VALUES (
        p_workspace_id, v_sale_id, NULL,
        v_item->>'productName',
        (v_item->>'quantity')::NUMERIC,
        (v_item->>'unitPrice')::NUMERIC,
        (v_item->>'discount')::NUMERIC,
        0,
        (v_item->>'total')::NUMERIC,
        'one_time', NULL, 'pc'
      );
      CONTINUE;
    END IF;

    v_product_id := (v_item->>'productId')::UUID;

    INSERT INTO sale_items (
      workspace_id, sale_id, product_id, product_name,
      quantity, unit_price, discount, tax, total, item_type,
      product_unit_id, unit_name
    ) VALUES (
      p_workspace_id, v_sale_id, v_product_id,
      v_item->>'productName',
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unitPrice')::NUMERIC,
      (v_item->>'discount')::NUMERIC,
      0,
      (v_item->>'total')::NUMERIC,
      'product',
      CASE WHEN (v_item->>'productUnitId') IS NOT NULL AND (v_item->>'productUnitId') <> ''
           THEN (v_item->>'productUnitId')::UUID ELSE NULL END,
      COALESCE(NULLIF(v_item->>'unitName', ''), 'pc')
    );

    -- Re-fetch locked inventory row (already locked in step 1)
    SELECT * INTO v_inventory FROM inventory
    WHERE workspace_id = p_workspace_id AND product_id = v_product_id;

    -- TICKET-12: apply conversion formula
    v_conversion := 1;
    IF (v_item->>'productUnitId') IS NOT NULL AND (v_item->>'productUnitId') <> '' THEN
      SELECT conversion_factor INTO v_conversion
        FROM product_units WHERE id = (v_item->>'productUnitId')::UUID;
      v_conversion := COALESCE(v_conversion, 1);
    END IF;

    v_base_qty  := (v_item->>'quantity')::NUMERIC * v_conversion;
    v_new_stock := v_inventory.current_stock - v_base_qty;

    -- TICKET-08: write to inventory only (single source of truth)
    UPDATE inventory
      SET current_stock = v_new_stock, updated_at = NOW()
    WHERE id = v_inventory.id;

    INSERT INTO inventory_transactions (
      inventory_id, workspace_id, product_id,
      transaction_type, quantity, previous_stock, new_stock,
      reference_type, reference_id, notes, created_by
    ) VALUES (
      v_inventory.id, p_workspace_id, v_product_id,
      'out', v_base_qty, v_inventory.current_stock, v_new_stock,
      'sale', v_sale_id,
      'Sale: ' || p_invoice_number,
      p_user_id
    );
  END LOOP;

  -- ── 5. Customer ledger — sale debit ──────────────────────────────────────
  IF p_customer_id IS NOT NULL THEN
    PERFORM update_customer_ledger(
      p_customer_id, p_workspace_id,
      'sale', 'sale', v_sale_id,
      p_total, 0,
      'Sale: ' || p_invoice_number
    );
  END IF;

  -- ── 6. Initial payment (cash paid at time of sale) ────────────────────────
  IF p_paid_amount > 0 AND p_payment_method IS NOT NULL AND p_customer_id IS NOT NULL THEN
    INSERT INTO payments (
      workspace_id, customer_id, sale_id,
      amount, payment_method, payment_date,
      notes, created_by
    ) VALUES (
      p_workspace_id, p_customer_id, v_sale_id,
      p_paid_amount, p_payment_method, p_sale_date,
      'Payment for ' || p_invoice_number,
      p_user_id
    )
    RETURNING id INTO v_payment_id;

    PERFORM update_customer_ledger(
      p_customer_id, p_workspace_id,
      'payment', 'payment', v_payment_id,
      0, p_paid_amount,
      'Payment for ' || p_invoice_number
    );
  END IF;

  -- ── 7. Apply advance balance ──────────────────────────────────────────────
  IF v_applied > 0 AND p_customer_id IS NOT NULL THEN
    DECLARE
      v_adv_rec   RECORD;
      v_remaining NUMERIC := v_applied;
      v_consume   NUMERIC;
    BEGIN
      FOR v_adv_rec IN
        SELECT id, amount FROM payments
         WHERE workspace_id = p_workspace_id
           AND customer_id  = p_customer_id
           AND sale_id IS NULL
           AND deleted_at IS NULL
         ORDER BY payment_date ASC
      LOOP
        EXIT WHEN v_remaining <= 0;
        v_consume := LEAST(v_adv_rec.amount, v_remaining);

        IF v_consume >= v_adv_rec.amount THEN
          UPDATE payments
            SET sale_id = v_sale_id,
                notes   = 'Advance applied for ' || p_invoice_number
          WHERE id = v_adv_rec.id;
        ELSE
          UPDATE payments
            SET amount = v_adv_rec.amount - v_consume
          WHERE id = v_adv_rec.id;

          INSERT INTO payments (
            workspace_id, customer_id, sale_id,
            amount, payment_method, payment_date,
            notes, created_by
          ) VALUES (
            p_workspace_id, p_customer_id, v_sale_id,
            v_consume, 'advance', p_sale_date,
            'Advance applied for ' || p_invoice_number,
            p_user_id
          )
          RETURNING id INTO v_payment_id;

          PERFORM update_customer_ledger(
            p_customer_id, p_workspace_id,
            'payment', 'payment', v_payment_id,
            0, v_consume,
            'Advance applied for ' || p_invoice_number
          );
        END IF;

        v_remaining := v_remaining - v_consume;
      END LOOP;
    END;
  END IF;

  RETURN v_sale_id;
END;
$$;

-- ── Drop legacy sync trigger (no longer needed — inventory is sole source) ──
DROP TRIGGER IF EXISTS products_sync_legacy_stock ON products;
DROP FUNCTION IF EXISTS sync_legacy_product_stock_to_inventory();
