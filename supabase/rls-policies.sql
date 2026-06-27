-- Enable Row Level Security on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Users can view workspaces they are members of"
    ON workspaces FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        )
    );

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

CREATE POLICY "Users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (true);

-- Workspace members policies
CREATE POLICY "Users can view workspace members of their workspaces"
    ON workspace_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage workspace members"
    ON workspace_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );

-- Helper function to check workspace access
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

-- Helper function to check workspace role
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

-- Categories policies
CREATE POLICY "Users can view categories in their workspaces"
    ON categories FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage categories in their workspaces"
    ON categories FOR ALL
    USING (has_workspace_access(workspace_id));

-- Products policies
CREATE POLICY "Users can view products in their workspaces"
    ON products FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage products in their workspaces"
    ON products FOR ALL
    USING (has_workspace_access(workspace_id));

-- Inventory transactions policies
CREATE POLICY "Users can view inventory transactions in their workspaces"
    ON inventory_transactions FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create inventory transactions in their workspaces"
    ON inventory_transactions FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

-- Customers policies
CREATE POLICY "Users can view customers in their workspaces"
    ON customers FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage customers in their workspaces"
    ON customers FOR ALL
    USING (has_workspace_access(workspace_id));

-- Suppliers policies
CREATE POLICY "Users can view suppliers in their workspaces"
    ON suppliers FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage suppliers in their workspaces"
    ON suppliers FOR ALL
    USING (has_workspace_access(workspace_id));

-- Sales policies
CREATE POLICY "Users can view sales in their workspaces"
    ON sales FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage sales in their workspaces"
    ON sales FOR ALL
    USING (has_workspace_access(workspace_id));

-- Sale items policies
CREATE POLICY "Users can view sale items in their workspaces"
    ON sale_items FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage sale items in their workspaces"
    ON sale_items FOR ALL
    USING (has_workspace_access(workspace_id));

-- Purchases policies
CREATE POLICY "Users can view purchases in their workspaces"
    ON purchases FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage purchases in their workspaces"
    ON purchases FOR ALL
    USING (has_workspace_access(workspace_id));

-- Purchase items policies
CREATE POLICY "Users can view purchase items in their workspaces"
    ON purchase_items FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage purchase items in their workspaces"
    ON purchase_items FOR ALL
    USING (has_workspace_access(workspace_id));

-- Expenses policies
CREATE POLICY "Users can view expenses in their workspaces"
    ON expenses FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can manage expenses in their workspaces"
    ON expenses FOR ALL
    USING (has_workspace_access(workspace_id));

-- Payments policies
CREATE POLICY "Users can view payments in their workspaces"
    ON payments FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create payments in their workspaces"
    ON payments FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

-- Customer ledger policies
CREATE POLICY "Users can view customer ledger in their workspaces"
    ON customer_ledger FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create customer ledger entries in their workspaces"
    ON customer_ledger FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

-- Supplier ledger policies
CREATE POLICY "Users can view supplier ledger in their workspaces"
    ON supplier_ledger FOR SELECT
    USING (has_workspace_access(workspace_id));

CREATE POLICY "Users can create supplier ledger entries in their workspaces"
    ON supplier_ledger FOR INSERT
    WITH CHECK (has_workspace_access(workspace_id));

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid() AND has_workspace_access(workspace_id));

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Owners and admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (has_workspace_role(workspace_id, 'admin'));

CREATE POLICY "System can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);
