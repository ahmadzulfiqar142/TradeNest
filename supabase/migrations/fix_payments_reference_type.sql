-- Drop columns that don't belong on payments (they belong on customer_ledger only)
ALTER TABLE payments
  DROP COLUMN IF EXISTS reference_type,
  DROP COLUMN IF EXISTS reference_id;
