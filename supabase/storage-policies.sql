-- Product image uploads
-- Run this once in Supabase SQL editor after the main schema.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Workspace members can upload product images"
    ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images"
    ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can update product images"
    ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete product images"
    ON storage.objects;

CREATE POLICY "Workspace members can upload product images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'product-images'
        AND EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id::text = (storage.foldername(name))[1]
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

CREATE POLICY "Workspace members can update product images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'product-images'
        AND EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id::text = (storage.foldername(name))[1]
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can delete product images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'product-images'
        AND EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id::text = (storage.foldername(name))[1]
            AND workspace_members.user_id = auth.uid()
        )
    );
