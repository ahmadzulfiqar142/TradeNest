-- Add database function for expiry alerts
CREATE OR REPLACE FUNCTION get_expiry_alerts(
    p_workspace_id UUID,
    p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER,
    stock_quantity INTEGER,
    category_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.expiry_date,
        (p.expiry_date - CURRENT_DATE) AS days_until_expiry,
        p.stock_quantity,
        c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.workspace_id = p_workspace_id
        AND p.expiry_date IS NOT NULL
        AND p.expiry_date <= CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL
        AND p.is_active = TRUE
    ORDER BY 
        CASE 
            WHEN p.expiry_date < CURRENT_DATE THEN 0  -- Expired first
            ELSE 1
        END,
        p.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Add database function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(
    p_workspace_id UUID
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    stock_quantity INTEGER,
    min_stock_quantity INTEGER,
    selling_price DECIMAL(10,2),
    category_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock_quantity,
        p.min_stock_quantity,
        p.selling_price,
        c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.workspace_id = p_workspace_id
        AND p.is_active = TRUE
        AND p.stock_quantity <= p.min_stock_quantity
    ORDER BY 
        (p.stock_quantity::FLOAT / NULLIF(p.min_stock_quantity, 0)) ASC,
        p.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Add index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_products_expiry_date 
ON products(workspace_id, expiry_date) 
WHERE is_active = TRUE AND expiry_date IS NOT NULL;

-- Add index for low stock queries
CREATE INDEX IF NOT EXISTS idx_products_low_stock 
ON products(workspace_id, stock_quantity, min_stock_quantity) 
WHERE is_active = TRUE;