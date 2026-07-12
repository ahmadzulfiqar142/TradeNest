-- Add item_type to sale_items to distinguish product vs one-time line items
DO $$ BEGIN
  CREATE TYPE sale_item_type AS ENUM ('product', 'one_time');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS item_type sale_item_type NOT NULL DEFAULT 'product';

-- Backfill: rows with no product_id are one-time items
UPDATE sale_items
  SET item_type = 'one_time'
  WHERE product_id IS NULL;
