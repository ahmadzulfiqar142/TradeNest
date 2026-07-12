-- Make product_id nullable in sale_items to support custom line items
-- This allows creating sales with custom items that don't exist in the products table

ALTER TABLE sale_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL
ALTER TABLE sale_items
  DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey,
  ADD CONSTRAINT sale_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sale_items_product
  ON sale_items(product_id)
  WHERE product_id IS NOT NULL;