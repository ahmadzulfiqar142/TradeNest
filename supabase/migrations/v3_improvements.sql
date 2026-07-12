-- V3: Improvements — unique SKU/barcode, sale transaction RPC

-- 1. Unique SKU per workspace (nulls allowed — partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_workspace_sku
  ON products(workspace_id, sku)
  WHERE sku IS NOT NULL AND sku <> '';

-- 2. Unique barcode per workspace (nulls allowed — partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_workspace_barcode
  ON products(workspace_id, barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

-- 3. Atomic sale creation RPC
-- Validates stock, inserts sale + items, deducts stock, records inventory
-- transactions, records ledger entries, and handles advance consumption.
-- All inside a single transaction — if anything fails, everything rolls back.
CREATE OR REPLACE FUNCTION create_sale_transaction(
  p_workspace_id    UUID,
  p_user_id         UUID,
  p_invoice_number  TEXT,
  p_customer_id     UUID,
  p_subtotal        NUMERIC,
  p_discount        NUMERIC,
  p_total           NUMERIC,
  p_paid_amount     NUMERIC,
  p_remaining       NUMERIC,
  p_status          TEXT,
  p_notes           TEXT,
  p_sale_date       DATE,
  p_payment_method  TEXT,
  p_items           JSONB   -- [{productId, productName, quantity, unitPrice, discount, total}]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id       UUID;
  v_payment_id    UUID;
  v_item          JSONB;
  v_product_id    UUID;
  v_prev_stock    INTEGER;
  v_new_stock     INTEGER;
  v_qty           INTEGER;
  v_advance       NUMERIC := 0;
  v_applied       NUMERIC := 0;
  v_effective_paid NUMERIC;
  v_effective_rem  NUMERIC;
  v_effective_status TEXT;
BEGIN
  -- ── 1. Stock validation ──────────────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    -- Skip stock validation for one-time line items
    CONTINUE WHEN (v_item->>'type') = 'one_time'
               OR (v_item->>'productId') IS NULL
               OR (v_item->>'productId') = '';

    v_product_id := (v_item->>'productId')::UUID;
    v_qty        := (v_item->>'quantity')::INTEGER;

    SELECT stock_quantity INTO v_prev_stock
      FROM products
     WHERE id = v_product_id AND workspace_id = p_workspace_id
     FOR UPDATE;  -- row-lock to prevent race conditions

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    IF v_prev_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        (v_item->>'productName'), v_prev_stock, v_qty;
    END IF;
  END LOOP;

  -- ── 2. Resolve advance balance ───────────────────────────────────────────
  IF p_customer_id IS NOT NULL AND p_remaining > 0 THEN
    -- Read available advance from unallocated payments (same as server action)
    SELECT COALESCE(SUM(amount), 0) INTO v_advance
      FROM payments
     WHERE workspace_id = p_workspace_id
       AND customer_id  = p_customer_id
       AND sale_id IS NULL
       AND deleted_at IS NULL;

    -- v_advance now contains the available advance balance
    -- Apply as much as needed to cover the remaining amount
    IF v_advance > 0 THEN
      v_applied := LEAST(v_advance, p_remaining);
    END IF;
  END IF;

  v_effective_paid   := p_paid_amount + v_applied;
  v_effective_rem    := GREATEST(0, p_total - v_effective_paid);
  v_effective_status := CASE
    WHEN v_effective_paid <= 0          THEN 'pending'
    WHEN v_effective_paid >= p_total    THEN 'paid'
    ELSE                                     'partially_paid'
  END;

  -- ── 3. Insert sale ───────────────────────────────────────────────────────
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

  -- ── 4. Insert items + deduct stock ──────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INTEGER;

    -- One-time line items: no product FK, no stock deduction
    IF (v_item->>'type') = 'one_time' OR (v_item->>'productId') IS NULL OR (v_item->>'productId') = '' THEN
      INSERT INTO sale_items (
        workspace_id, sale_id, product_id, product_name,
        quantity, unit_price, discount, tax, total, item_type
      ) VALUES (
        p_workspace_id, v_sale_id, NULL,
        v_item->>'productName',
        v_qty,
        (v_item->>'unitPrice')::NUMERIC,
        (v_item->>'discount')::NUMERIC,
        0,
        (v_item->>'total')::NUMERIC,
        'one_time'
      );
      CONTINUE;
    END IF;

    v_product_id := (v_item->>'productId')::UUID;

    INSERT INTO sale_items (
      workspace_id, sale_id, product_id, product_name,
      quantity, unit_price, discount, tax, total, item_type
    ) VALUES (
      p_workspace_id, v_sale_id, v_product_id,
      v_item->>'productName',
      v_qty,
      (v_item->>'unitPrice')::NUMERIC,
      (v_item->>'discount')::NUMERIC,
      0,
      (v_item->>'total')::NUMERIC,
      'product'
    );

    SELECT stock_quantity INTO v_prev_stock
      FROM products WHERE id = v_product_id;

    v_new_stock := v_prev_stock - v_qty;

    UPDATE products
       SET stock_quantity = v_new_stock, updated_at = NOW()
     WHERE id = v_product_id AND workspace_id = p_workspace_id;

    INSERT INTO inventory_transactions (
      workspace_id, product_id, transaction_type,
      quantity, previous_stock, new_stock,
      reference_type, reference_id, notes, created_by
    ) VALUES (
      p_workspace_id, v_product_id, 'out',
      v_qty, v_prev_stock, v_new_stock,
      'sale', v_sale_id,
      'Sale: ' || p_invoice_number,
      p_user_id
    );
  END LOOP;

  -- ── 5. Customer ledger — sale debit ─────────────────────────────────────
  IF p_customer_id IS NOT NULL THEN
    PERFORM update_customer_ledger(
      p_customer_id, p_workspace_id,
      'sale', 'sale', v_sale_id,
      p_total, 0,
      'Sale: ' || p_invoice_number
    );
  END IF;

  -- ── 6. Initial payment (cash paid at time of sale) ───────────────────────
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

  -- ── 7. Apply advance balance ─────────────────────────────────────────────
  -- Consume unlinked advance payments oldest-first, link them to this sale
  IF v_applied > 0 AND p_customer_id IS NOT NULL THEN
    DECLARE
      v_adv_rec     RECORD;
      v_remaining   NUMERIC := v_applied;
      v_consume     NUMERIC;
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
          -- Fully consumed: link this payment to the sale
          UPDATE payments
             SET sale_id = v_sale_id,
                 notes   = 'Advance applied for ' || p_invoice_number
           WHERE id = v_adv_rec.id;
        ELSE
          -- Partially consumed: shrink original, create a linked record for the used portion
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
