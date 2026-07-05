-- V2: Sales-first architecture migration (idempotent)

-- 1. Add sale_status enum
DO $$ BEGIN
  CREATE TYPE sale_status AS ENUM ('pending', 'partially_paid', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add status column to sales table
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS status sale_status NOT NULL DEFAULT 'pending';

-- Migrate existing payment_status → status (safe to run multiple times)
UPDATE sales SET status =
  CASE payment_status
    WHEN 'paid'    THEN 'paid'::sale_status
    WHEN 'partial' THEN 'partially_paid'::sale_status
    WHEN 'overdue' THEN 'pending'::sale_status
    ELSE 'pending'::sale_status
  END
WHERE status = 'pending';

-- 3. Rename invoice_id → sale_id only if invoice_id still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE payments RENAME COLUMN invoice_id TO sale_id;
  END IF;
END $$;

-- 4. Add sale_id if it still doesn't exist (fresh DB with no invoice_id either)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES sales(id) ON DELETE SET NULL;

-- 5. Add reference_number column
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- 6. Drop legacy product-in-payment columns
ALTER TABLE payments
  DROP COLUMN IF EXISTS product_id;

ALTER TABLE payments
  DROP COLUMN IF EXISTS quantity;

ALTER TABLE payments
  DROP COLUMN IF EXISTS payment_status;

-- 7. Index for sale_id on payments
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
