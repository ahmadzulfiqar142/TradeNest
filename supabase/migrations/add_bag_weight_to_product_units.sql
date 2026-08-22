-- Add bag_weight fields to product_units for packaging units (Bag, Box, Carton, etc.)
-- bag_weight: the weight/qty contained in one packaging unit (e.g. 50 for a 50kg bag)
-- bag_weight_unit: the unit symbol of that weight (e.g. 'kg', 'g', 'L')
ALTER TABLE product_units
  ADD COLUMN IF NOT EXISTS bag_weight NUMERIC(14, 3) NULL,
  ADD COLUMN IF NOT EXISTS bag_weight_unit TEXT NULL;
