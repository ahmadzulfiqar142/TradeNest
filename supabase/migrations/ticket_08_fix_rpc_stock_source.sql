-- TICKET-08: Rewrite RPCs to read from inventory.current_stock (single source of truth)
-- Both functions previously read products.stock_quantity which is now stock_quantity_legacy.

CREATE OR REPLACE FUNCTION get_low_stock_products(p_workspace_id UUID)
RETURNS TABLE (
  product_id        UUID,
  product_name      TEXT,
  stock_quantity    NUMERIC,
  min_stock_quantity NUMERIC,
  selling_price     DECIMAL(10,2),
  category_name     TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    i.current_stock                   AS stock_quantity,
    i.minimum_stock                   AS min_stock_quantity,
    p.selling_price,
    c.name                            AS category_name
  FROM inventory i
  JOIN products p  ON p.id = i.product_id AND p.workspace_id = i.workspace_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE i.workspace_id = p_workspace_id
    AND p.is_active = TRUE
    AND i.current_stock <= i.minimum_stock
  ORDER BY
    (i.current_stock / NULLIF(i.minimum_stock, 0)) ASC NULLS FIRST,
    p.name ASC;
END;
$$ LANGUAGE plpgsql;

-- get_expiry_alerts is fully rewritten in ticket_15_batch_expiry_alerts.sql
-- with batch_id/batch_number columns. Do not define it here.

-- Drop old indexes that referenced products.stock_quantity (now renamed)
DROP INDEX IF EXISTS idx_products_low_stock;

-- New index on inventory for low-stock queries
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
  ON inventory(workspace_id, current_stock, minimum_stock);
