-- Backfill: recalculate paid_amount, remaining_amount, status for all sales
-- Run this once in Supabase SQL editor

-- Sales that HAVE payments: recalculate from payment totals
UPDATE sales s
SET
  paid_amount      = COALESCE(p.total_paid, 0),
  remaining_amount = GREATEST(0, s.total - COALESCE(p.total_paid, 0)),
  status = CASE
    WHEN COALESCE(p.total_paid, 0) <= 0       THEN 'pending'::sale_status
    WHEN COALESCE(p.total_paid, 0) >= s.total THEN 'paid'::sale_status
    ELSE 'partially_paid'::sale_status
  END
FROM (
  SELECT sale_id, SUM(amount) AS total_paid
  FROM payments
  WHERE deleted_at IS NULL
    AND sale_id IS NOT NULL
  GROUP BY sale_id
) p
WHERE s.id = p.sale_id;

-- Sales with NO payments: reset to pending
UPDATE sales
SET
  paid_amount      = 0,
  remaining_amount = total,
  status           = 'pending'::sale_status
WHERE id NOT IN (
  SELECT DISTINCT sale_id
  FROM payments
  WHERE deleted_at IS NULL
    AND sale_id IS NOT NULL
)
AND (paid_amount != 0 OR remaining_amount != total);
