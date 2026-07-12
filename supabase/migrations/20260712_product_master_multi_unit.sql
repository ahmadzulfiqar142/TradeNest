-- TDD-001 Product Management: keep product master data separate from inventory.
-- Legacy price and stock columns remain temporarily for existing sales/inventory flows.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Units table is already created in schema.sql with symbol and type columns
-- This migration adds product_units and product_prices tables for multi-unit support

CREATE TABLE IF NOT EXISTS product_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  conversion_factor NUMERIC(14, 6) NOT NULL CHECK (conversion_factor > 0),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, unit_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_units_one_default_per_product
  ON product_units(product_id) WHERE is_default;

CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_unit_id UUID NOT NULL REFERENCES product_units(id) ON DELETE CASCADE,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_units_product_id_idx ON product_units(product_id);
CREATE INDEX IF NOT EXISTS product_prices_product_unit_id_idx ON product_prices(product_unit_id);

-- Ensure unique constraint on units.name exists (idempotent)
ALTER TABLE units DROP CONSTRAINT IF EXISTS units_name_unique;
ALTER TABLE units ADD CONSTRAINT units_name_unique UNIQUE (name);

-- Insert default units (idempotent)
INSERT INTO units (name, abbreviation, symbol, type) VALUES
  ('Gram', 'g', 'g', 'weight'), ('Kilogram', 'kg', 'kg', 'weight'),
  ('Milliliter', 'ml', 'ml', 'volume'), ('Liter', 'L', 'L', 'volume'),
  ('Piece', 'pc', 'pc', 'count'), ('Box', 'box', 'box', 'packaging'),
  ('Pack', 'pack', 'pack', 'packaging'), ('Bag', 'bag', 'bag', 'packaging'),
  ('Sachet', 'sachet', 'sachet', 'packaging')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent)
DROP POLICY IF EXISTS "Authenticated users can view units" ON units;
CREATE POLICY "Authenticated users can view units" ON units FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Workspace users can view product units" ON product_units;
CREATE POLICY "Workspace users can view product units" ON product_units FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_units.product_id AND has_workspace_access(p.workspace_id)));

DROP POLICY IF EXISTS "Workspace users can manage product units" ON product_units;
CREATE POLICY "Workspace users can manage product units" ON product_units FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_units.product_id AND has_workspace_access(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_units.product_id AND has_workspace_access(p.workspace_id)));

DROP POLICY IF EXISTS "Workspace users can view product prices" ON product_prices;
CREATE POLICY "Workspace users can view product prices" ON product_prices FOR SELECT
  USING (EXISTS (SELECT 1 FROM product_units pu JOIN products p ON p.id = pu.product_id WHERE pu.id = product_prices.product_unit_id AND has_workspace_access(p.workspace_id)));

DROP POLICY IF EXISTS "Workspace users can manage product prices" ON product_prices;
CREATE POLICY "Workspace users can manage product prices" ON product_prices FOR ALL
  USING (EXISTS (SELECT 1 FROM product_units pu JOIN products p ON p.id = pu.product_id WHERE pu.id = product_prices.product_unit_id AND has_workspace_access(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM product_units pu JOIN products p ON p.id = pu.product_id WHERE pu.id = product_prices.product_unit_id AND has_workspace_access(p.workspace_id)));
