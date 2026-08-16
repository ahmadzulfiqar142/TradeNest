-- TICKET-13: Batch tracking schema
-- Every stock-in creates a product_batches row.
-- inventory.current_stock always equals SUM(quantity_remaining) across batches.

CREATE TABLE IF NOT EXISTS product_batches (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID        NOT NULL REFERENCES workspaces(id)  ON DELETE CASCADE,
  product_id        UUID        NOT NULL REFERENCES products(id)    ON DELETE CASCADE,
  batch_number      TEXT,
  expiry_date       DATE,
  received_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  -- stored in base units (same unit as inventory.current_stock)
  quantity_received DECIMAL(14,3) NOT NULL CHECK (quantity_received > 0),
  quantity_remaining DECIMAL(14,3) NOT NULL CHECK (quantity_remaining >= 0),
  purchase_price    DECIMAL(12,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_batches_product
  ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry
  ON product_batches(expiry_date)
  WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_batches_workspace_product
  ON product_batches(workspace_id, product_id);

ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace users can view product batches" ON product_batches;
CREATE POLICY "Workspace users can view product batches" ON product_batches
  FOR SELECT USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Workspace users can manage product batches" ON product_batches;
CREATE POLICY "Workspace users can manage product batches" ON product_batches
  FOR ALL
  USING (has_workspace_access(workspace_id))
  WITH CHECK (has_workspace_access(workspace_id));

-- Add batch_id reference to inventory_transactions (TICKET-14 prep)
ALTER TABLE inventory_transactions
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL;

-- ── stock_in_batch RPC ────────────────────────────────────────────────────────
-- Called on every purchase/stock-in for a batch-tracked product.
-- Applies: base_units = quantity_entered × conversion_factor (Section 5.9 formula)
-- Creates a product_batches row and updates inventory.current_stock atomically.
CREATE OR REPLACE FUNCTION stock_in_batch(
  p_workspace_id   UUID,
  p_product_id     UUID,
  p_product_unit_id UUID,        -- the unit the quantity was entered in
  p_quantity       NUMERIC,      -- quantity_entered (in the entered unit)
  p_batch_number   TEXT,
  p_expiry_date    DATE,
  p_purchase_price DECIMAL,
  p_user_id        UUID,
  p_reference_id   UUID DEFAULT NULL,  -- purchase_id if coming from a purchase
  p_notes          TEXT DEFAULT NULL
) RETURNS UUID                         -- returns new batch id
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inventory      inventory%ROWTYPE;
  v_conversion     NUMERIC := 1;
  v_base_qty       NUMERIC;
  v_new_stock      NUMERIC;
  v_batch_id       UUID;
  v_transaction_id UUID;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  -- Resolve conversion factor
  IF p_product_unit_id IS NOT NULL THEN
    SELECT conversion_factor INTO v_conversion
      FROM product_units WHERE id = p_product_unit_id;
    v_conversion := COALESCE(v_conversion, 1);
  END IF;

  -- base_units_to_move = quantity_entered × conversion_factor (Section 5.9)
  v_base_qty := p_quantity * v_conversion;

  -- Lock inventory row
  SELECT * INTO v_inventory FROM inventory
  WHERE workspace_id = p_workspace_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for this product';
  END IF;

  v_new_stock := v_inventory.current_stock + v_base_qty;

  -- Create batch row
  INSERT INTO product_batches (
    workspace_id, product_id, batch_number, expiry_date,
    quantity_received, quantity_remaining, purchase_price
  ) VALUES (
    p_workspace_id, p_product_id,
    NULLIF(BTRIM(COALESCE(p_batch_number, '')), ''),
    p_expiry_date,
    v_base_qty, v_base_qty,
    p_purchase_price
  )
  RETURNING id INTO v_batch_id;

  -- Update inventory
  UPDATE inventory
    SET current_stock = v_new_stock, updated_at = NOW()
  WHERE id = v_inventory.id;

  -- Log transaction
  INSERT INTO inventory_transactions (
    inventory_id, workspace_id, product_id, batch_id,
    transaction_type, quantity, previous_stock, new_stock,
    reference_type, reference_id, notes, created_by
  ) VALUES (
    v_inventory.id, p_workspace_id, p_product_id, v_batch_id,
    'in', v_base_qty, v_inventory.current_stock, v_new_stock,
    CASE WHEN p_reference_id IS NOT NULL THEN 'purchase' ELSE 'stock_in' END,
    p_reference_id,
    COALESCE(p_notes, 'Stock in' || CASE WHEN p_batch_number IS NOT NULL THEN ' — batch ' || p_batch_number ELSE '' END),
    p_user_id
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_batch_id;
END;
$$;
