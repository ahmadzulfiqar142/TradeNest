-- Add payment_status column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add index for payment_status
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- Update existing payments to have 'paid' status (assuming existing payments are completed)
UPDATE payments SET payment_status = 'paid' WHERE deleted_at IS NULL AND amount > 0;