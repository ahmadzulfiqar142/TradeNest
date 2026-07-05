-- Add deleted_at column for soft delete functionality
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- Add comment
COMMENT ON COLUMN products.deleted_at IS 'Timestamp for soft delete functionality';