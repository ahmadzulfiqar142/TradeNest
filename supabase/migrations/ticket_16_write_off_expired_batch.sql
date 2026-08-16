-- TICKET-16: Expired stock write-off flow
-- write_off_expired_batch: manually or scheduled write-off of an expired batch.
-- Zeroes quantity_remaining, deducts from inventory.current_stock,
-- logs an inventory_transactions row with reference_type='write_off' and notes='expired'.

CREATE OR REPLACE FUNCTION write_off_expired_batch(
  p_workspace_id UUID,
  p_batch_id     UUID,
  p_user_id      UUID,
  p_notes        TEXT DEFAULT 'Expired stock write-off'
) RETURNS UUID   -- returns inventory_transaction id
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_batch      product_batches%ROWTYPE;
  v_inventory  inventory%ROWTYPE;
  v_new_stock  NUMERIC;
  v_txn_id     UUID;
BEGIN
  -- Fetch and validate batch
  SELECT * INTO v_batch
    FROM product_batches
   WHERE id = p_batch_id AND workspace_id = p_workspace_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  IF v_batch.quantity_remaining <= 0 THEN
    RAISE EXCEPTION 'Batch already fully consumed or written off';
  END IF;
  IF v_batch.expiry_date IS NULL OR v_batch.expiry_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Batch has not expired yet (expiry: %)', v_batch.expiry_date;
  END IF;

  -- Lock inventory row
  SELECT * INTO v_inventory FROM inventory
  WHERE workspace_id = p_workspace_id AND product_id = v_batch.product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for this product';
  END IF;

  v_new_stock := v_inventory.current_stock - v_batch.quantity_remaining;

  -- Zero out the batch
  UPDATE product_batches
    SET quantity_remaining = 0
  WHERE id = p_batch_id;

  -- Deduct from inventory
  UPDATE inventory
    SET current_stock = v_new_stock, updated_at = NOW()
  WHERE id = v_inventory.id;

  -- Log write-off transaction
  INSERT INTO inventory_transactions (
    inventory_id, workspace_id, product_id, batch_id,
    transaction_type, quantity, previous_stock, new_stock,
    reference_type, notes, created_by
  ) VALUES (
    v_inventory.id, p_workspace_id, v_batch.product_id, p_batch_id,
    'adjustment',
    -v_batch.quantity_remaining,
    v_inventory.current_stock,
    v_new_stock,
    'write_off',
    COALESCE(p_notes, 'Expired stock write-off'),
    p_user_id
  )
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;
