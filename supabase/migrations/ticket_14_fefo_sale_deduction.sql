-- TICKET-14: FEFO sale deduction logic
-- Extends create_sale_transaction: for products that have batch rows,
-- deduct quantity_remaining from batches ordered by expiry_date ASC (soonest first),
-- spilling into subsequent batches when one batch is insufficient.
-- Products with no batch rows fall back to the existing inventory-only deduction.

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
  -- FEFO
  v_batch            RECORD;
  v_to_deduct        NUMERIC;
  v_batch_deduct     NUMERIC;
  v_has_batches      BOOLEAN;
BEGIN
  -- ── 1. Stock validation with row-level locking ────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    CONTINUE WHEN (v_item->>'type') = 'one_time'
               OR (v_item->>'productId') IS NULL
               OR (v_item->>'productId') = '';

    v_product_id := (v_item->>'productId')::UUID;

    SELECT * INTO v_inventory FROM inventory
    WHERE workspace_id = p_workspace_id AND product_id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Inventory record not found for product: %', v_product_id;
    END IF;

    v_conversion := 1;
    IF (v_item->>'productUnitId') IS NOT NULL AND (v_item->>'productUnitId') <> '' THEN
      SELECT conversion_factor INTO v_conversion
        FROM product_units WHERE id = (v_item->>'productUnitId')::UUID;
      v_conversion := COALESCE(v_conversion, 1);
    END IF;

    v_base_qty := (v_item->>'quantity')::NUMERIC * v_conversion;

    IF v_inventory.current_stock < v_base_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: % (base units)',
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

  -- ── 4. Insert items + deduct stock (FEFO where batches exist) ────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
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
        0, (v_item->>'total')::NUMERIC,
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
      0, (v_item->>'total')::NUMERIC,
      'product',
      CASE WHEN (v_item->>'productUnitId') IS NOT NULL AND (v_item->>'productUnitId') <> ''
           THEN (v_item->>'productUnitId')::UUID ELSE NULL END,
      COALESCE(NULLIF(v_item->>'unitName', ''), 'pc')
    );

    SELECT * INTO v_inventory FROM inventory
    WHERE workspace_id = p_workspace_id AND product_id = v_product_id;

    v_conversion := 1;
    IF (v_item->>'productUnitId') IS NOT NULL AND (v_item->>'productUnitId') <> '' THEN
      SELECT conversion_factor INTO v_conversion
        FROM product_units WHERE id = (v_item->>'productUnitId')::UUID;
      v_conversion := COALESCE(v_conversion, 1);
    END IF;

    v_base_qty  := (v_item->>'quantity')::NUMERIC * v_conversion;
    v_new_stock := v_inventory.current_stock - v_base_qty;

    -- Update inventory (single source of truth)
    UPDATE inventory
      SET current_stock = v_new_stock, updated_at = NOW()
    WHERE id = v_inventory.id;

    -- Check if this product has batch rows
    SELECT EXISTS (
      SELECT 1 FROM product_batches
      WHERE workspace_id = p_workspace_id
        AND product_id   = v_product_id
        AND quantity_remaining > 0
    ) INTO v_has_batches;

    IF v_has_batches THEN
      -- FEFO: deduct from batches ordered by soonest expiry_date first
      -- NULL expiry_date treated as last (no expiry = deduct last)
      v_to_deduct := v_base_qty;

      FOR v_batch IN
        SELECT id, quantity_remaining
          FROM product_batches
         WHERE workspace_id      = p_workspace_id
           AND product_id        = v_product_id
           AND quantity_remaining > 0
         ORDER BY expiry_date ASC NULLS LAST, received_date ASC
      LOOP
        EXIT WHEN v_to_deduct <= 0;

        v_batch_deduct := LEAST(v_batch.quantity_remaining, v_to_deduct);

        UPDATE product_batches
          SET quantity_remaining = quantity_remaining - v_batch_deduct
        WHERE id = v_batch.id;

        -- Log per-batch transaction with batch_id reference
        INSERT INTO inventory_transactions (
          inventory_id, workspace_id, product_id, batch_id,
          transaction_type, quantity, previous_stock, new_stock,
          reference_type, reference_id, notes, created_by
        ) VALUES (
          v_inventory.id, p_workspace_id, v_product_id, v_batch.id,
          'out', v_batch_deduct, v_inventory.current_stock + v_to_deduct, v_new_stock,
          'sale', v_sale_id,
          'Sale: ' || p_invoice_number,
          p_user_id
        );

        v_to_deduct := v_to_deduct - v_batch_deduct;
      END LOOP;
    ELSE
      -- No batches: single inventory_transactions row (existing behaviour)
      INSERT INTO inventory_transactions (
        inventory_id, workspace_id, product_id,
        transaction_type, quantity, previous_stock, new_stock,
        reference_type, reference_id, notes, created_by
      ) VALUES (
        v_inventory.id, p_workspace_id, v_product_id,
        'out', v_base_qty, v_inventory.current_stock + v_base_qty, v_new_stock,
        'sale', v_sale_id,
        'Sale: ' || p_invoice_number,
        p_user_id
      );
    END IF;
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

  -- ── 6. Initial payment ────────────────────────────────────────────────────
  IF p_paid_amount > 0 AND p_payment_method IS NOT NULL AND p_customer_id IS NOT NULL THEN
    INSERT INTO payments (
      workspace_id, customer_id, sale_id,
      amount, payment_method, payment_date, notes, created_by
    ) VALUES (
      p_workspace_id, p_customer_id, v_sale_id,
      p_paid_amount, p_payment_method, p_sale_date,
      'Payment for ' || p_invoice_number, p_user_id
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
          UPDATE payments SET amount = v_adv_rec.amount - v_consume WHERE id = v_adv_rec.id;

          INSERT INTO payments (
            workspace_id, customer_id, sale_id,
            amount, payment_method, payment_date, notes, created_by
          ) VALUES (
            p_workspace_id, p_customer_id, v_sale_id,
            v_consume, 'advance', p_sale_date,
            'Advance applied for ' || p_invoice_number, p_user_id
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
