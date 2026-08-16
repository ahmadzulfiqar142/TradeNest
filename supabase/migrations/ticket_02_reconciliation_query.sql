-- TICKET-02: Reconciliation query
-- Run this BEFORE applying v4_inventory_integrity.sql to quantify drift.
-- Expected: zero rows after v4 migration is applied and all writes go through inventory.

SELECT
  p.id                                                        AS product_id,
  p.name                                                      AS product_name,
  p.workspace_id,
  p.stock_quantity                                            AS legacy_stock,
  i.current_stock                                             AS inventory_stock,
  p.stock_quantity - COALESCE(i.current_stock, 0)            AS drift,
  CASE
    WHEN i.id IS NULL THEN 'missing_inventory_row'
    WHEN p.stock_quantity = i.current_stock THEN 'in_sync'
    ELSE 'drifted'
  END                                                         AS status
FROM products p
LEFT JOIN inventory i
  ON i.product_id = p.id AND i.workspace_id = p.workspace_id
WHERE p.stock_quantity IS DISTINCT FROM COALESCE(i.current_stock, 0)
ORDER BY ABS(p.stock_quantity - COALESCE(i.current_stock, 0)) DESC;
