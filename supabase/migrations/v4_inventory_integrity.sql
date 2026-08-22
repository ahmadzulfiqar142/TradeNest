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
    SET status = 'cancelled',
        payment_status = CASE WHEN paid_amount > 0 THEN 'refunded' ELSE 'pending' END,
        updated_at = NOW()
  WHERE id = p_sale_id AND workspace_id = p_workspace_id;
END;
$$;

-- NOTE: create_sale_transaction() used to be redefined here (TICKET-08 + 09,
-- inventory-only deduction, no batch/FEFO logic). Removed to avoid three
-- competing CREATE OR REPLACE definitions across the migrations folder
-- (v3, v4, ticket_14) fighting over which one wins on alphabetical apply
-- order — v4 always ran last and silently discarded the FEFO logic added in
-- ticket_14. The canonical, current definition — including FEFO batch
-- deduction — now lives solely in
-- supabase/migrations/ticket_14_fefo_sale_deduction.sql.

-- ── Drop legacy sync trigger (no longer needed — inventory is sole source) ──
DROP TRIGGER IF EXISTS products_sync_legacy_stock ON products;
DROP FUNCTION IF EXISTS sync_legacy_product_stock_to_inventory();
