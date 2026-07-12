-- Add product_unit_id to sale_items to support multi-unit sales

-- Add product_unit_id column
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS product_unit_id UUID REFERENCES product_units(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS sale_items_product_unit_id_idx ON sale_items(product_unit_id);

-- Add unit_name column to store the unit name for display (denormalized for convenience)
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS unit_name TEXT;

-- Update existing records to have unit_name as 'pc' (piece) as default
UPDATE sale_items
  SET unit_name = 'pc'
  WHERE unit_name IS NULL;

-- Make unit_name NOT NULL after updating existing records
ALTER TABLE sale_items
  ALTER COLUMN unit_name SET NOT NULL;