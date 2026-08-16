-- Fix adjust_inventory function overload ambiguity
-- The database has two versions of adjust_inventory (6-param and 7-param with p_unit_id)
-- This causes PostgreSQL to fail when calling with 6 parameters
-- Drop the 7-parameter version since the application only uses 6 parameters

DROP FUNCTION IF EXISTS adjust_inventory(
  p_workspace_id UUID,
  p_product_id UUID,
  p_direction TEXT,
  p_quantity NUMERIC,
  p_reason TEXT,
  p_user_id UUID,
  p_unit_id UUID
);

-- Ensure the 6-parameter version exists
CREATE OR REPLACE FUNCTION adjust_inventory(
  p_workspace_id UUID,
  p_product_id UUID,
  p_direction TEXT,
  p_quantity NUMERIC,
  p_reason TEXT,
  p_user_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inventory inventory%ROWTYPE;
  v_delta NUMERIC;
  v_new_stock NUMERIC;
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

  -- Row-level lock prevents concurrent adjustments on same product
  SELECT * INTO v_inventory FROM inventory
  WHERE workspace_id = p_workspace_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for this product';
  END IF;

  v_delta := CASE WHEN p_direction = 'increase' THEN p_quantity ELSE -p_quantity END;
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