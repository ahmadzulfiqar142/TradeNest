-- Seed all standard units (idempotent — safe to run multiple times)
-- Uses ON CONFLICT on symbol so existing rows are updated with correct data

INSERT INTO units (name, abbreviation, symbol, type) VALUES
  ('Gram',       'g',      'g',      'weight'),
  ('Kilogram',   'kg',     'kg',     'weight'),
  ('Milligram',  'mg',     'mg',     'weight'),
  ('Milliliter', 'ml',     'ml',     'volume'),
  ('Liter',      'L',      'L',      'volume'),
  ('Piece',      'pc',     'pc',     'count'),
  ('Dozen',      'dz',     'dz',     'count'),
  ('Box',        'box',    'box',    'packaging'),
  ('Pack',       'pack',   'pack',   'packaging'),
  ('Bag',        'bag',    'bag',    'packaging'),
  ('Sachet',     'sachet', 'sachet', 'packaging'),
  ('Carton',     'ctn',    'ctn',    'packaging'),
  ('Bottle',     'btl',    'btl',    'packaging')
ON CONFLICT (symbol) DO UPDATE
  SET name         = EXCLUDED.name,
      abbreviation = EXCLUDED.abbreviation,
      type         = EXCLUDED.type;
