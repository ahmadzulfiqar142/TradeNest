-- Enable Row Level Security on all tables (idempotent)
ALTER TABLE IF EXISTS workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Workspaces policies (idempotent)
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
CREATE POLICY "Users can view workspaces they are members of"
    ON workspaces FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can update their workspaces" ON workspaces;
CREATE POLICY "Owners can update their workspaces"
    ON workspaces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (true);

-- Workspace members policies (idempotent)
DROP POLICY IF EXISTS "Users can view workspace members of their workspaces" ON workspace_members;
CREATE POLICY "Users can view workspace members of their workspaces"
    ON workspace_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners and admins can manage workspace members" ON workspace_members;
CREATE POLICY "Owners and admins can manage workspace members"
    ON workspace_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        -- Allow inserting yourself as owner into a new workspace (no members yet)
        (role = 'owner' AND user_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
        ))
        OR
        -- Allow owners/admins to add members to existing workspaces
        EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );

-- Helper function to check workspace access (idempotent)
CREATE OR REPLACE FUNCTION has_workspace_access(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = workspace_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check workspace role (idempotent)
CREATE OR REPLACE FUNCTION has_workspace_role(workspace_uuid UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = workspace_uuid
        AND user_id = auth.uid()
        AND (
            CASE required_role
                WHEN 'owner' THEN role = 'owner'
                WHEN 'admin' THEN role IN ('owner', 'admin')
                WHEN 'manager' THEN role IN ('owner', 'admin', 'manager')
                ELSE TRUE
            END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Categories policies (idempotent)
DROP POLICY IF EXISTS "Users can view categories in their workspaces" ON categories;
CREATE POLICY "Users can view categories in their workspaces"
    ON categories FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage categories in their workspaces" ON categories;
CREATE POLICY "Users can manage categories in their workspaces"
    ON categories FOR ALL
    USING (has_workspace_access(workspace_id));

-- Products policies (idempotent)
DROP POLICY IF EXISTS "Users can view products in their workspaces" ON products;
CREATE POLICY "Users can view products in their workspaces"
    ON products FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage products in their workspaces" ON products;
CREATE POLICY "Users can manage products in their workspaces"
    ON products FOR ALL
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Authenticated users can view units" ON units;
CREATE POLICY "Authenticated users can view units" ON units FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Workspace users can manage product units" ON product_units;
CREATE POLICY "Workspace users can manage product units" ON product_units FOR ALL
    USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_units.product_id AND has_workspace_access(products.workspace_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_units.product_id AND has_workspace_access(products.workspace_id)));

DROP POLICY IF EXISTS "Workspace users can manage product prices" ON product_prices;
CREATE POLICY "Workspace users can manage product prices" ON product_prices FOR ALL
    USING (EXISTS (SELECT 1 FROM product_units JOIN products ON products.id = product_units.product_id WHERE product_units.id = product_prices.product_unit_id AND has_workspace_access(products.workspace_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM product_units JOIN products ON products.id = product_units.product_id WHERE product_units.id = product_prices.product_unit_id AND has_workspace_access(products.workspace_id)));

-- Inventory transactions policies (idempotent)
DROP POLICY IF EXISTS "Users can view inventory transactions in their workspaces" ON inventory_transactions;
CREATE POLICY "Users can view inventory transactions in their workspaces"
    ON inventory_transactions FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can create inventory transactions in their workspaces" ON inventory_transactions;
CREATE POLICY "Users can create inventory transactions in their workspaces"
    ON inventory_transactions FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can view inventory in their workspaces" ON inventory;
CREATE POLICY "Users can view inventory in their workspaces"
    ON inventory FOR SELECT USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage inventory in their workspaces" ON inventory;
CREATE POLICY "Users can manage inventory in their workspaces"
    ON inventory FOR ALL USING (has_workspace_access(workspace_id)) WITH CHECK (has_workspace_access(workspace_id));

-- Customers policies (idempotent)
DROP POLICY IF EXISTS "Users can view customers in their workspaces" ON customers;
CREATE POLICY "Users can view customers in their workspaces"
    ON customers FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage customers in their workspaces" ON customers;
CREATE POLICY "Users can manage customers in their workspaces"
    ON customers FOR ALL
    USING (has_workspace_access(workspace_id));

-- Suppliers policies (idempotent)
DROP POLICY IF EXISTS "Users can view suppliers in their workspaces" ON suppliers;
CREATE POLICY "Users can view suppliers in their workspaces"
    ON suppliers FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage suppliers in their workspaces" ON suppliers;
CREATE POLICY "Users can manage suppliers in their workspaces"
    ON suppliers FOR ALL
    USING (has_workspace_access(workspace_id));

-- Sales policies (idempotent)
DROP POLICY IF EXISTS "Users can view sales in their workspaces" ON sales;
CREATE POLICY "Users can view sales in their workspaces"
    ON sales FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage sales in their workspaces" ON sales;
CREATE POLICY "Users can manage sales in their workspaces"
    ON sales FOR ALL
    USING (has_workspace_access(workspace_id));

-- Sale items policies (idempotent)
DROP POLICY IF EXISTS "Users can view sale items in their workspaces" ON sale_items;
CREATE POLICY "Users can view sale items in their workspaces"
    ON sale_items FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage sale items in their workspaces" ON sale_items;
CREATE POLICY "Users can manage sale items in their workspaces"
    ON sale_items FOR ALL
    USING (has_workspace_access(workspace_id));

-- Purchases policies (idempotent)
DROP POLICY IF EXISTS "Users can view purchases in their workspaces" ON purchases;
CREATE POLICY "Users can view purchases in their workspaces"
    ON purchases FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage purchases in their workspaces" ON purchases;
CREATE POLICY "Users can manage purchases in their workspaces"
    ON purchases FOR ALL
    USING (has_workspace_access(workspace_id));

-- Purchase items policies (idempotent)
DROP POLICY IF EXISTS "Users can view purchase items in their workspaces" ON purchase_items;
CREATE POLICY "Users can view purchase items in their workspaces"
    ON purchase_items FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage purchase items in their workspaces" ON purchase_items;
CREATE POLICY "Users can manage purchase items in their workspaces"
    ON purchase_items FOR ALL
    USING (has_workspace_access(workspace_id));

-- Expenses policies (idempotent)
DROP POLICY IF EXISTS "Users can view expenses in their workspaces" ON expenses;
CREATE POLICY "Users can view expenses in their workspaces"
    ON expenses FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can manage expenses in their workspaces" ON expenses;
CREATE POLICY "Users can manage expenses in their workspaces"
    ON expenses FOR ALL
    USING (has_workspace_access(workspace_id));

-- Payments policies (idempotent)
DROP POLICY IF EXISTS "Users can view payments in their workspaces" ON payments;
CREATE POLICY "Users can view payments in their workspaces"
    ON payments FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can create payments in their workspaces" ON payments;
CREATE POLICY "Users can create payments in their workspaces"
    ON payments FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can update payments in their workspaces" ON payments;
CREATE POLICY "Users can update payments in their workspaces"
    ON payments FOR UPDATE
    USING (has_workspace_access(workspace_id))
    WITH CHECK (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can delete payments in their workspaces" ON payments;
CREATE POLICY "Users can delete payments in their workspaces"
    ON payments FOR DELETE
    USING (has_workspace_access(workspace_id));

-- Customer ledger policies (idempotent)
DROP POLICY IF EXISTS "Users can view customer ledger in their workspaces" ON customer_ledger;
CREATE POLICY "Users can view customer ledger in their workspaces"
    ON customer_ledger FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can create customer ledger entries in their workspaces" ON customer_ledger;
CREATE POLICY "Users can create customer ledger entries in their workspaces"
    ON customer_ledger FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can update customer ledger in their workspaces" ON customer_ledger;
CREATE POLICY "Users can update customer ledger in their workspaces"
    ON customer_ledger FOR UPDATE
    USING (has_workspace_access(workspace_id))
    WITH CHECK (has_workspace_access(workspace_id));

-- Supplier ledger policies (idempotent)
DROP POLICY IF EXISTS "Users can view supplier ledger in their workspaces" ON supplier_ledger;
CREATE POLICY "Users can view supplier ledger in their workspaces"
    ON supplier_ledger FOR SELECT
    USING (has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can create supplier ledger entries in their workspaces" ON supplier_ledger;
CREATE POLICY "Users can create supplier ledger entries in their workspaces"
    ON supplier_ledger FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

-- Notifications policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid() AND has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Audit logs policies (idempotent)
DROP POLICY IF EXISTS "Owners and admins can view audit logs" ON audit_logs;
CREATE POLICY "Owners and admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (has_workspace_role(workspace_id, 'admin'));

DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "System can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);
