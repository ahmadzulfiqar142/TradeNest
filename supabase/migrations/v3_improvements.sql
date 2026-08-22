-- V3: Improvements — unique SKU/barcode

-- 1. Unique SKU per workspace (nulls allowed — partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_workspace_sku
  ON products(workspace_id, sku)
  WHERE sku IS NOT NULL AND sku <> '';

-- 2. Unique barcode per workspace (nulls allowed — partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_workspace_barcode
  ON products(workspace_id, barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

-- NOTE: create_sale_transaction() used to be defined here. It has been moved
-- out to avoid three competing CREATE OR REPLACE definitions across the
-- migrations folder (v3, v4, ticket_14) fighting over which one wins on
-- alphabetical apply order. The canonical, current definition — including
-- FEFO batch deduction — now lives solely in
-- supabase/migrations/ticket_14_fefo_sale_deduction.sql.
