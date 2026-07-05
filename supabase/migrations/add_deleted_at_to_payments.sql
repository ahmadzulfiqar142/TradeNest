-- Add deleted_at column for soft delete functionality
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);