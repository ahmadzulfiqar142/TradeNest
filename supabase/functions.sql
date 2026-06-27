-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(
    p_workspace_id UUID,
    p_prefix TEXT DEFAULT 'INV'
)
RETURNS TEXT AS $$
DECLARE
    last_number INTEGER;
    new_number TEXT;
BEGIN
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ '^\d+$' THEN invoice_number::INTEGER
            ELSE 0
        END
    ), 0) INTO last_number
    FROM sales
    WHERE workspace_id = p_workspace_id;
    
    new_number := p_prefix || '-' || LPAD((last_number + 1)::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_transaction_type transaction_type,
    p_workspace_id UUID,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock_quantity INTO current_stock
    FROM products
    WHERE id = p_product_id AND workspace_id = p_workspace_id;
    
    -- Calculate new stock
    IF p_transaction_type = 'in' THEN
        new_stock := current_stock + p_quantity;
    ELSIF p_transaction_type = 'out' THEN
        new_stock := current_stock - p_quantity;
        IF new_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient stock';
        END IF;
    ELSE
        new_stock := p_quantity;
    END IF;
    
    -- Update product stock
    UPDATE products
    SET stock_quantity = new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Create inventory transaction record
    INSERT INTO inventory_transactions (
        workspace_id,
        product_id,
        transaction_type,
        quantity,
        previous_stock,
        new_stock,
        reference_type,
        reference_id,
        notes,
        created_by
    ) VALUES (
        p_workspace_id,
        p_product_id,
        p_transaction_type,
        p_quantity,
        current_stock,
        new_stock,
        p_reference_type,
        p_reference_id,
        p_notes,
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to complete a sale
CREATE OR REPLACE FUNCTION complete_sale(
    p_sale_id UUID,
    p_workspace_id UUID
)
RETURNS VOID AS $$
DECLARE
    sale_record RECORD;
    item_record RECORD;
BEGIN
    -- Get sale details
    SELECT * INTO sale_record
    FROM sales
    WHERE id = p_sale_id AND workspace_id = p_workspace_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sale not found';
    END IF;
    
    -- Update inventory for each item
    FOR item_record IN 
        SELECT * FROM sale_items 
        WHERE sale_id = p_sale_id
    LOOP
        PERFORM update_product_stock(
            item_record.product_id,
            item_record.quantity,
            'out'::transaction_type,
            p_workspace_id,
            'sale',
            p_sale_id,
            'Sale: ' || sale_record.invoice_number
        );
    END LOOP;
    
    -- Update customer ledger if credit sale
    IF sale_record.sale_type IN ('credit', 'partial') AND sale_record.customer_id IS NOT NULL THEN
        PERFORM update_customer_ledger(
            sale_record.customer_id,
            p_workspace_id,
            'debit',
            'sale',
            p_sale_id,
            sale_record.remaining_amount,
            0,
            'Sale: ' || sale_record.invoice_number
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer ledger
CREATE OR REPLACE FUNCTION update_customer_ledger(
    p_customer_id UUID,
    p_workspace_id UUID,
    p_transaction_type TEXT,
    p_reference_type TEXT,
    p_reference_id UUID,
    p_debit DECIMAL(10,2) DEFAULT 0,
    p_credit DECIMAL(10,2) DEFAULT 0,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_balance DECIMAL(10,2);
    new_balance DECIMAL(10,2);
BEGIN
    -- Get current balance
    SELECT current_balance INTO current_balance
    FROM customers
    WHERE id = p_customer_id AND workspace_id = p_workspace_id;
    
    -- Calculate new balance
    new_balance := current_balance + p_debit - p_credit;
    
    -- Update customer balance
    UPDATE customers
    SET current_balance = new_balance,
        updated_at = NOW()
    WHERE id = p_customer_id;
    
    -- Create ledger entry
    INSERT INTO customer_ledger (
        workspace_id,
        customer_id,
        transaction_type,
        reference_type,
        reference_id,
        debit,
        credit,
        balance,
        description,
        created_by
    ) VALUES (
        p_workspace_id,
        p_customer_id,
        p_transaction_type,
        p_reference_type,
        p_reference_id,
        p_debit,
        p_credit,
        new_balance,
        p_description,
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update supplier ledger
CREATE OR REPLACE FUNCTION update_supplier_ledger(
    p_supplier_id UUID,
    p_workspace_id UUID,
    p_transaction_type TEXT,
    p_reference_type TEXT,
    p_reference_id UUID,
    p_debit DECIMAL(10,2) DEFAULT 0,
    p_credit DECIMAL(10,2) DEFAULT 0,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_balance DECIMAL(10,2);
    new_balance DECIMAL(10,2);
BEGIN
    -- Get current balance
    SELECT outstanding_balance INTO current_balance
    FROM suppliers
    WHERE id = p_supplier_id AND workspace_id = p_workspace_id;
    
    -- Calculate new balance
    new_balance := current_balance + p_credit - p_debit;
    
    -- Update supplier balance
    UPDATE suppliers
    SET outstanding_balance = new_balance,
        updated_at = NOW()
    WHERE id = p_supplier_id;
    
    -- Create ledger entry
    INSERT INTO supplier_ledger (
        workspace_id,
        supplier_id,
        transaction_type,
        reference_type,
        reference_id,
        debit,
        credit,
        balance,
        description,
        created_by
    ) VALUES (
        p_workspace_id,
        p_supplier_id,
        p_transaction_type,
        p_reference_type,
        p_reference_id,
        p_debit,
        p_credit,
        new_balance,
        p_description,
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to complete a purchase
CREATE OR REPLACE FUNCTION complete_purchase(
    p_purchase_id UUID,
    p_workspace_id UUID
)
RETURNS VOID AS $$
DECLARE
    purchase_record RECORD;
    item_record RECORD;
BEGIN
    -- Get purchase details
    SELECT * INTO purchase_record
    FROM purchases
    WHERE id = p_purchase_id AND workspace_id = p_workspace_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase not found';
    END IF;
    
    -- Update inventory for each item
    FOR item_record IN 
        SELECT * FROM purchase_items 
        WHERE purchase_id = p_purchase_id
    LOOP
        PERFORM update_product_stock(
            item_record.product_id,
            item_record.quantity,
            'in'::transaction_type,
            p_workspace_id,
            'purchase',
            p_purchase_id,
            'Purchase: ' || purchase_record.invoice_number
        );
    END LOOP;
    
    -- Update supplier ledger if credit purchase
    IF purchase_record.remaining_amount > 0 AND purchase_record.supplier_id IS NOT NULL THEN
        PERFORM update_supplier_ledger(
            purchase_record.supplier_id,
            p_workspace_id,
            'credit',
            'purchase',
            p_purchase_id,
            0,
            purchase_record.remaining_amount,
            'Purchase: ' || purchase_record.invoice_number
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_workspace_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'today_sales', COALESCE((
            SELECT SUM(total)
            FROM sales
            WHERE workspace_id = p_workspace_id
            AND sale_date = CURRENT_DATE
        ), 0),
        'today_purchases', COALESCE((
            SELECT SUM(total)
            FROM purchases
            WHERE workspace_id = p_workspace_id
            AND purchase_date = CURRENT_DATE
        ), 0),
        'monthly_sales', COALESCE((
            SELECT SUM(total)
            FROM sales
            WHERE workspace_id = p_workspace_id
            AND DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0),
        'monthly_purchases', COALESCE((
            SELECT SUM(total)
            FROM purchases
            WHERE workspace_id = p_workspace_id
            AND DATE_TRUNC('month', purchase_date) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0),
        'monthly_expenses', COALESCE((
            SELECT SUM(amount)
            FROM expenses
            WHERE workspace_id = p_workspace_id
            AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0),
        'pending_payments', COALESCE((
            SELECT SUM(remaining_amount)
            FROM sales
            WHERE workspace_id = p_workspace_id
            AND payment_status IN ('pending', 'partial')
        ), 0),
        'low_stock_count', (
            SELECT COUNT(*)
            FROM products
            WHERE workspace_id = p_workspace_id
            AND stock_quantity <= min_stock_quantity
            AND is_active = TRUE
        ),
        'total_customers', (
            SELECT COUNT(*)
            FROM customers
            WHERE workspace_id = p_workspace_id
            AND is_active = TRUE
        ),
        'total_products', (
            SELECT COUNT(*)
            FROM products
            WHERE workspace_id = p_workspace_id
            AND is_active = TRUE
        ),
        'inventory_value', COALESCE((
            SELECT SUM(stock_quantity * purchase_price)
            FROM products
            WHERE workspace_id = p_workspace_id
            AND is_active = TRUE
        ), 0)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
