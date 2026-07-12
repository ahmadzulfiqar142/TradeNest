-- TDD-002: inventory balances and movements are independent from product master data.
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  base_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  current_stock NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  maximum_stock NUMERIC(14, 3),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, product_id),
  CHECK (maximum_stock IS NULL OR maximum_stock >= minimum_stock)
);

ALTER TABLE inventory_transactions
  ADD COLUMN IF NOT EXISTS inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL;

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'return';

ALTER TABLE inventory_transactions
  DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
-- Existing database enum only supports in/out/adjustment. Keep the compatible values
-- and represent returns as `in` with reference_type = return.

CREATE INDEX IF NOT EXISTS inventory_workspace_product_idx ON inventory(workspace_id, product_id);
CREATE INDEX IF NOT EXISTS inventory_low_stock_idx ON inventory(workspace_id, current_stock, minimum_stock);

-- One inventory balance per existing product, using its default product unit.
INSERT INTO inventory (workspace_id, product_id, base_unit_id, current_stock, minimum_stock)
SELECT p.workspace_id, p.id, pu.unit_id, COALESCE(p.stock_quantity, 0), COALESCE(p.min_stock_quantity, 0)
FROM products p
JOIN product_units pu ON pu.product_id = p.id AND pu.is_default = TRUE
ON CONFLICT (workspace_id, product_id) DO NOTHING;

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace users can view inventory" ON inventory FOR SELECT
  USING (has_workspace_access(workspace_id));
CREATE POLICY "Workspace users can manage inventory" ON inventory FOR ALL
  USING (has_workspace_access(workspace_id)) WITH CHECK (has_workspace_access(workspace_id));

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
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  IF p_reason IS NULL OR BTRIM(p_reason) = '' THEN RAISE EXCEPTION 'An adjustment reason is required'; END IF;
  IF p_direction NOT IN ('increase', 'decrease') THEN RAISE EXCEPTION 'Adjustment type must be increase or decrease'; END IF;

  SELECT * INTO v_inventory FROM inventory
  WHERE workspace_id = p_workspace_id AND product_id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventory record not found for this product'; END IF;
  v_delta := CASE WHEN p_direction = 'increase' THEN p_quantity ELSE -p_quantity END;
  v_new_stock := v_inventory.current_stock + v_delta;
  IF v_new_stock < 0 THEN RAISE EXCEPTION 'Stock cannot become negative'; END IF;

  UPDATE inventory SET current_stock = v_new_stock, updated_at = NOW() WHERE id = v_inventory.id;
  -- Compatibility projection for older sales/reporting code. Inventory remains
  -- the source of truth; this column is removed once those consumers migrate.
  UPDATE products SET stock_quantity = v_new_stock, updated_at = NOW() WHERE id = p_product_id AND workspace_id = p_workspace_id;
  INSERT INTO inventory_transactions (inventory_id, workspace_id, product_id, transaction_type, quantity, previous_stock, new_stock, reference_type, notes, created_by)
  VALUES (v_inventory.id, p_workspace_id, p_product_id, 'adjustment', v_delta, v_inventory.current_stock, v_new_stock, 'adjustment', BTRIM(p_reason), p_user_id)
  RETURNING id INTO v_transaction_id;
  RETURN v_transaction_id;
END;
$$;

-- Create a zero-stock inventory balance when a product receives its default unit.
CREATE OR REPLACE FUNCTION ensure_product_inventory()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_workspace_id UUID;
BEGIN
  IF NEW.is_default IS NOT TRUE THEN RETURN NEW; END IF;
  SELECT workspace_id INTO v_workspace_id FROM products WHERE id = NEW.product_id;
  INSERT INTO inventory (workspace_id, product_id, base_unit_id)
  VALUES (v_workspace_id, NEW.product_id, NEW.unit_id)
  ON CONFLICT (workspace_id, product_id)
  DO UPDATE SET base_unit_id = EXCLUDED.base_unit_id, updated_at = NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS product_units_ensure_inventory ON product_units;
CREATE TRIGGER product_units_ensure_inventory
AFTER INSERT OR UPDATE OF unit_id, is_default ON product_units
FOR EACH ROW EXECUTE FUNCTION ensure_product_inventory();

-- Transitional compatibility for existing sales code: any legacy stock update is
-- mirrored into the inventory balance. Product actions no longer alter this column.
CREATE OR REPLACE FUNCTION sync_legacy_product_stock_to_inventory()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity THEN
    UPDATE inventory SET current_stock = NEW.stock_quantity, updated_at = NOW()
    WHERE workspace_id = NEW.workspace_id AND product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS products_sync_legacy_stock ON products;
CREATE TRIGGER products_sync_legacy_stock
AFTER UPDATE OF stock_quantity ON products
FOR EACH ROW EXECUTE FUNCTION sync_legacy_product_stock_to_inventory();
