-- Fix units table: remove workspace_id column if it exists
-- Units are global/system-wide and should not have workspace_id

-- Drop policies that depend on workspace_id FIRST (before dropping the column)
DROP POLICY IF EXISTS "Users can view units in their workspaces" ON units;
DROP POLICY IF EXISTS "Users can manage units in their workspaces" ON units;

-- Drop the workspace_id column if it exists
ALTER TABLE IF EXISTS units DROP COLUMN IF EXISTS workspace_id;

-- Ensure the units table has the correct structure
-- (id, name, symbol, type, created_at, updated_at)

-- Add unique constraints if they don't exist (needed for ON CONFLICT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'units_name_key') THEN
        ALTER TABLE units ADD CONSTRAINT units_name_key UNIQUE (name);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'units_symbol_key') THEN
        ALTER TABLE units ADD CONSTRAINT units_symbol_key UNIQUE (symbol);
    END IF;
END $$;

-- Seed default units (idempotent)
INSERT INTO units (name, abbreviation, symbol, type) VALUES
  ('Gram', 'g', 'g', 'weight'),
  ('Kilogram', 'kg', 'kg', 'weight'),
  ('Milliliter', 'ml', 'ml', 'volume'),
  ('Liter', 'L', 'L', 'volume'),
  ('Piece', 'pc', 'pc', 'count'),
  ('Box', 'box', 'box', 'packaging'),
  ('Pack', 'pack', 'pack', 'packaging'),
  ('Bag', 'bag', 'bag', 'packaging'),
  ('Sachet', 'sachet', 'sachet', 'packaging')
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies for units (global, no workspace restriction)
DROP POLICY IF EXISTS "Authenticated users can view units" ON units;
CREATE POLICY "Authenticated users can view units" 
  ON units FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to manage units (since they're global)
DROP POLICY IF EXISTS "Authenticated users can manage units" ON units;
CREATE POLICY "Authenticated users can manage units" 
  ON units FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);
