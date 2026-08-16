-- TICKET-15: Batch-aware expiry alerts
-- Rewrites get_expiry_alerts to query product_batches instead of products.expiry_date.
-- Alerts now identify the specific batch at risk, not just a product-level flag.
-- Falls back to products.expiry_date for products with no batch rows (legacy support).

CREATE OR REPLACE FUNCTION get_expiry_alerts(
  p_workspace_id   UUID,
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  product_id        UUID,
  product_name      TEXT,
  batch_id          UUID,
  batch_number      TEXT,
  expiry_date       DATE,
  days_until_expiry INTEGER,
  stock_quantity    NUMERIC,   -- quantity_remaining for this specific batch
  category_name     TEXT
) AS $$
BEGIN
  -- Batch-tracked products: one row per expiring batch
  RETURN QUERY
  SELECT
    p.id                                          AS product_id,
    p.name                                        AS product_name,
    pb.id                                         AS batch_id,
    pb.batch_number,
    pb.expiry_date,
    (pb.expiry_date - CURRENT_DATE)::INTEGER      AS days_until_expiry,
    pb.quantity_remaining                         AS stock_quantity,
    c.name                                        AS category_name
  FROM product_batches pb
  JOIN products p    ON p.id = pb.product_id AND p.workspace_id = pb.workspace_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE pb.workspace_id     = p_workspace_id
    AND pb.expiry_date      IS NOT NULL
    AND pb.expiry_date      <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL
    AND pb.quantity_remaining > 0
    AND p.is_active         = TRUE

  UNION ALL

  -- Legacy: products with expiry_date but no batch rows
  SELECT
    p.id,
    p.name,
    NULL::UUID                                    AS batch_id,
    NULL::TEXT                                    AS batch_number,
    p.expiry_date,
    (p.expiry_date - CURRENT_DATE)::INTEGER       AS days_until_expiry,
    i.current_stock                               AS stock_quantity,
    c.name                                        AS category_name
  FROM products p
  JOIN inventory i   ON i.product_id = p.id AND i.workspace_id = p.workspace_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.workspace_id  = p_workspace_id
    AND p.expiry_date   IS NOT NULL
    AND p.expiry_date   <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL
    AND p.is_active     = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM product_batches pb2
      WHERE pb2.product_id   = p.id
        AND pb2.workspace_id = p.workspace_id
    )

  ORDER BY
    CASE WHEN expiry_date < CURRENT_DATE THEN 0 ELSE 1 END,
    expiry_date ASC;
END;
$$ LANGUAGE plpgsql;
