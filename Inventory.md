# Technical Design Document: Inventory & Sales Data Integrity Overhaul

**Status:** Backend complete, frontend complete — includes both "Stock in" and "Adjust stock" flows. Pending RPC internals review (`create_sale_transaction`, `adjust_inventory`) and one business decision (Section 10, Q6).

---

## 1. Overview

**Purpose:** Consolidate stock management into a single, decimal-safe, atomic system that correctly supports both weight-based (sugar, rice) and pack-based (pesticide) products.

---

## 2. Problem Statement

The current codebase has two competing stock systems that were never fully consolidated after a schema migration. This causes silent stock drift, breaks the audit trail for fractional-unit products, and leaves stock-restoration on sale cancellation non-atomic.

---

## 3. Goals

- Single source of truth for current stock
- Decimal-safe throughout (support 0.25kg, 1.5kg, etc.)
- All stock mutations atomic (no partial-failure corruption)
- Consolidated, non-duplicated authorization and advance-payment logic
- Row-level locking to prevent overselling on concurrent sales
- Correct handling of bulk-to-retail unit conversion (e.g., 1 bag purchased → sold off in mixed kg/g portions) with no separate "bag count" to maintain
- An enforced, unambiguous base unit per product at the schema level, with `inventory.base_unit_id` always consistent with it

### Non-Goals

- New features (multi-warehouse, barcode scanning, etc.)
- UI/UX redesign
- Changing pricing model or tax logic (see Section 12 for a scope note on this)

---

## 4. Current Architecture (As-Is)

| Component | Purpose | Written by | Read by | Problem |
|---|---|---|---|---|
| `products.stock_quantity` | Legacy integer stock count | `cancelSale` (direct update) | Unknown — needs audit | Conflicts with `inventory.current_stock`; integer can't hold fractional values |
| `products.min_stock_quantity` | Legacy reorder threshold | Manual/unclear | `getLowStockProducts`? unclear | Duplicate of `inventory.minimum_stock` |
| `inventory.current_stock` | Current stock system, decimal | `adjust_inventory` RPC (assumed) | `getProductsForSale`, dashboard | Correct design, but not universally used |
| `inventory.minimum_stock` / `maximum_stock` | Reorder thresholds, decimal | Manual/unclear | `get_low_stock_products` RPC (assumed) | Needs confirmation vs. legacy column |
| `inventory_transactions.quantity` | Audit ledger | `cancelSale` (direct insert), RPCs | Dashboard, history views | `INTEGER` type — cannot log fractional stock movements accurately |
| `product_units` + `conversion_factor` | Unit conversion (bag→kg→g) | `replaceProductUnits` | Sale/purchase calculations | Correctly designed, no known issues |
| `sale_items` | Line items per sale | `createSale`, `updateSale` | `getSaleDetails`, cancellation | Code inserts `item_type`, `product_unit_id`, `unit_name`, `workspace_id` — not present in shared SQL schema. **Needs direct verification against live DB schema.** |
| `create_sale_transaction` (RPC) | Atomic sale creation + stock deduction | `createSale` | — | Internal SQL not yet reviewed — locking behavior unknown |
| `adjust_inventory` (RPC) | Manual stock adjustment | `adjustInventory` action | — | Internal SQL not yet reviewed — which table does it write to? |
| `cancelSale` | Restores stock on cancellation | Sales module | — | Loops per-item with separate select/update/insert; **not wrapped in a transaction** |

---

## 5. Detailed Issues & Required Changes

### 5.1 Dual Stock Source (Critical)
**Problem:** `cancelSale` writes to `products.stock_quantity`; `getProductsForSale` reads from `inventory.current_stock`. These will diverge on every cancellation.
**Fix:** Designate `inventory.current_stock` as the only source of truth. Rewrite `cancelSale`'s stock-restore logic to call `adjust_inventory` (or an equivalent RPC) instead of updating `products` directly.
**Decision needed:** Keep `products.stock_quantity` as a denormalized read-cache (updated only via trigger off `inventory`), or drop it entirely.

### 5.2 Integer Ledger vs Decimal Stock (Critical)
**Problem:** `inventory_transactions.quantity INTEGER` cannot represent a 0.25kg sale, while `inventory.current_stock DECIMAL(14,3)` can. This directly breaks audit-trail accuracy for the sugar/pesticide use case.
**Fix:** `ALTER TABLE inventory_transactions ALTER COLUMN quantity TYPE DECIMAL(14,3)`. Low risk — widening a numeric type is additive and backward-compatible.
**Verification:** Confirm no application code assumes integer rounding on this field (e.g., `Math.floor`/`parseInt` anywhere touching `inventory_transactions.quantity`).

### 5.3 Non-Atomic Cancellation (High)
**Problem:** `cancelSale` loops through `sale_items`, doing separate `select → update → insert` per product outside a transaction. A failure on item 3 of 5 leaves inconsistent stock.
**Fix:** Create a `cancel_sale_transaction` RPC mirroring `create_sale_transaction`'s pattern — restore all item quantities and update sale status in one Postgres transaction.

### 5.4 Unverified RPC Internals (High — blocks other decisions)
**Problem:** `create_sale_transaction` and `adjust_inventory` are referenced but their SQL bodies haven't been reviewed. Unknown whether they:
- Use `SELECT ... FOR UPDATE` (or equivalent) to prevent overselling under concurrent sales
- Write to `inventory` alone or also touch `products.stock_quantity`
- Correctly apply `quantity_entered × conversion_factor` when deducting/adding stock in base units (see Section 5.9 for the worked example this must satisfy)
**Fix:** Pull and document the actual RPC source before finalizing sections 5.1–5.3. This is a blocking open question, not a nice-to-have.

### 5.5 Schema/Code Drift on `sale_items` (Medium)
**Problem:** `updateSale` inserts `item_type`, `product_unit_id`, `unit_name`, `workspace_id` into `sale_items`, but the shared SQL schema for that table shows only `product_id`, `quantity`, `unit_price`, etc., with no such columns.
**Fix:** Run `\d sale_items` (or equivalent) directly against the live database to confirm actual columns. If an unshown migration added them, document it here. If not, these inserts are either failing silently or being ignored by PostgREST — needs to be confirmed, not assumed.

### 5.6 Duplicated Authorization Logic (Medium)
**Problem:** `getAuthorizedUser(workspaceId)` is copy-pasted near-identically in `payments.ts`, `products.ts`, `sales.ts`, `inventory.ts`.
**Fix:** Extract to `lib/auth/workspace.ts`, single implementation, imported everywhere. No behavior change — pure refactor, low risk.

### 5.7 Duplicated Advance-Payment Consumption Logic (Medium)
**Problem:** "Consume oldest unlinked advance payments first" is implemented independently in both `createSale` and `createPayment`, with subtly different fallback handling.
**Fix:** Extract to a single `consumeAdvancePayments(workspaceId, customerId, amount)` helper, used by both call sites.

### 5.8 Missing Row-Level Locking (High — depends on 5.4)
**Problem:** No visible `SELECT ... FOR UPDATE` in the code shown; if absent in the RPCs too, two simultaneous sales of the last unit of stock could both succeed (oversell).
**Fix:** Once RPC internals are confirmed (5.4), add row-level locking on the `inventory` row for the product being sold, inside the same transaction as the stock deduction.

### 5.9 Bulk-to-Retail Unit Conversion — Worked Reference Example (New)
**Problem:** The system must support purchasing in a large unit (e.g., a 50kg bag) while selling in smaller units (kg, g) from the *same* stock pool — with no separate "bag count" tracked once the bag is received into stock. This is the core real-world scenario driving the entire unit-conversion design and needs a concrete reference so implementers don't have to reverse-engineer it from the architecture diagram alone.

**Reference setup — Sugar:**

| unit_id | conversion_factor (→ grams) | is_default |
|---|---|---|
| g | 1 | false |
| kg | 1000 | true |
| bag | 50000 | false |

Base unit = **gram**. `inventory.current_stock` is always stored in grams.

**Reference setup — Pesticide:**

| unit_id | conversion_factor (→ packs) | is_default |
|---|---|---|
| pack | 1 | true |

Base unit = **pack**. No conversion complexity — same code path, `conversion_factor = 1`.

**The universal formula every stock mutation must apply:**
```
base_units_to_move = quantity_entered × conversion_factor
```

**Worked example — receiving 1 bag, then selling it off in mixed portions:**

| Action | quantity_entered | unit | conversion_factor | base_units (grams) moved | `current_stock` after |
|---|---|---|---|---|---|
| Purchase | 1 | bag | 50000 | +50000 | 50000 |
| Sale | 1 | kg | 1000 | −1000 | 49000 |
| Sale | 1 | kg | 1000 | −1000 | 48000 |
| Sale | 0.25 | kg | 1000 | −250 | 47750 |
| Sale | 250 | g | 1 | −250 | 47500 |
| ... (repeats until the bag is exhausted) | | | | | 0 |

**Key point:** there is no "bags remaining" field anywhere in the data model. Once the 50,000g from the purchase enters `inventory.current_stock`, it is indistinguishable from grams received any other way. The "bag" only exists as a *purchase-time convenience unit* via its `conversion_factor` — it is never tracked as a discrete count post-receipt.

**Display conversion (read-only, for UI):** `current_stock` in grams can be converted back to kg or bags for display purely by division (`current_stock / conversion_factor`) — this is presentation-layer math only and must never be the system of record.

**Acceptance criterion:** Any RPC or function that mutates stock (`create_sale_transaction`, `adjust_inventory`, `cancel_sale_transaction`) must apply the `quantity_entered × conversion_factor` formula identically regardless of product type — the same code path must correctly handle both the sugar (3-unit) and pesticide (1-unit) cases with no product-type-specific branching.

### 5.10 `product_units` Schema Design Gaps (New — Critical)
**Problem:** The `product_units` table has no explicit, enforced concept of a "base unit" — the unit that `conversion_factor` values are relative to. This is currently only an assumption (whichever row has `conversion_factor = 1`), not a constraint. Specific gaps:

1. **No guaranteed base unit.** Nothing requires exactly one `product_units` row per product to represent the conversion root. A product could be inserted with `kg = 1000` and `bag = 50000` but no `g = 1` row, leaving the conversion basis ambiguous.
2. **`inventory.base_unit_id` is disconnected from `product_units`.** It's a separate field on the `inventory` table with no foreign key or check constraint tying it back to a valid row in that product's `product_units` list. Nothing prevents it from silently pointing to a unit the product doesn't even support — the same category of drift that caused the `products.stock_quantity` vs `inventory.current_stock` problem.
3. **`is_default` conflates two different concerns.** It currently drives both (a) which unit's price populates the legacy `products.selling_price`/`purchase_price` columns, and (b) implicitly, which unit is shown first at checkout. Neither of these is the same thing as "the storage/conversion base unit" — a shop may want `kg` shown by default while `gram` remains the correct internal base unit. One flag is doing two jobs.
4. **`replaceProductUnits` silently destroys price history.** On every product edit, the function deletes all `product_units` (cascading to `product_prices`) and reinserts from scratch. `product_prices.effective_from` implies historical price tracking was intended, but this delete-and-reinsert pattern wipes that history on every edit — `effective_from` is currently non-functional.
5. **No guard against mixing incompatible unit types.** `units.type` (`weight`, `count`, etc.) exists but nothing stops a `weight` unit and a `count` unit from being added as convertible units on the same product, which is not a meaningful conversion without an additional weight-per-piece rule this schema doesn't model.

**Fix:**
```sql
ALTER TABLE product_units
  ADD COLUMN is_base_unit BOOLEAN NOT NULL DEFAULT FALSE;

-- exactly one base unit per product
CREATE UNIQUE INDEX product_units_one_base_per_product
  ON product_units(product_id) WHERE is_base_unit;

-- the base unit's own conversion_factor must always be 1
ALTER TABLE product_units
  ADD CONSTRAINT base_unit_factor_is_one
  CHECK (NOT is_base_unit OR conversion_factor = 1);
```
- Keep `is_default` strictly as a **display concern** (which unit shows first in the sale UI) — separate from `is_base_unit` (the storage/conversion root), which is a **data-integrity concern**.
- Add a trigger (or CHECK, if expressible) ensuring all `product_units` rows for a given `product_id` share the same `units.type`, preventing incompatible unit mixing.
- Tie `inventory.base_unit_id` back to the corresponding `product_units.is_base_unit = true` row — via trigger, since a direct FK can't express "the base-unit row for this same product_id."
- Decide explicitly on `product_prices.effective_from`: either implement real price versioning (add `effective_to`, insert new rows on price change instead of deleting old ones) or remove the column if historical pricing was never actually intended. Leaving it as dead, non-functional schema is worse than either alternative.

**Acceptance criterion:** For any product, there is exactly one `product_units` row with `is_base_unit = true` and `conversion_factor = 1`, all `product_units` rows for that product share the same `units.type`, and `inventory.base_unit_id` always matches that product's designated base unit.

---

## 6. Proposed Target Architecture (To-Be)

```
inventory (single source of truth, decimal, always in base units)
  ↑ written only via
inventory_transactions (ledger, decimal, append-only)
  ↑ written only via
adjust_inventory RPC / cancel_sale_transaction RPC / create_sale_transaction RPC
  ↑ each applies: base_units_to_move = quantity_entered × conversion_factor
  ↑ called by
Sales, Purchases, Manual Adjustments, Cancellations (all app code)

products.stock_quantity → deprecated or trigger-synced cache, never written directly
```

Every stock-changing action in the app funnels through exactly one of three RPCs, each wrapped in a DB transaction with row locking, and each applying the same conversion formula from Section 5.9.

---

## 7. Data Migration Plan

1. **Reconciliation query first:** Diff `products.stock_quantity` vs `inventory.current_stock` for every product to quantify current drift before changing anything.
2. **Decide winner:** `inventory.current_stock` (decimal-native, matches unit-conversion design).
3. **Type migration:** Widen `inventory_transactions.quantity` to `DECIMAL(14,3)`.
4. **Column deprecation:** Rename `products.stock_quantity` → `products.stock_quantity_legacy` (don't drop immediately) so any missed reads fail loudly/visibly during transition rather than silently reading stale data.
5. **Cutover:** Once all reads confirmed migrated to `inventory`, drop the legacy column in a later release.

---

## 8. Rollout Sequence

| Step | Change | Risk | Depends on |
|---|---|---|---|
| 1 | Pull & review `create_sale_transaction` + `adjust_inventory` SQL | None (read-only) | — |
| 2 | Run reconciliation query, quantify drift | None (read-only) | — |
| 3 | Confirm live `sale_items` schema | None (read-only) | — |
| 4 | Widen `inventory_transactions.quantity` to decimal | Low | Step 1 |
| 5 | Extract shared `getAuthorizedUser` helper | Low, no behavior change | — |
| 6 | Extract shared advance-consumption helper | Low-Medium | — |
| 7 | Build `cancel_sale_transaction` RPC, rewire `cancelSale` | Medium | Steps 1, 4 |
| 8 | Redirect all remaining `products.stock_quantity` reads to `inventory` | Medium | Step 2 |
| 9 | Rename legacy column, monitor for breakage | Low | Step 8 |
| 10 | Add row-locking to RPCs if missing | High priority once confirmed | Step 1 |
| 11 | Drop legacy column | Low | Step 9, after monitoring period |

---

## 9. Testing & Verification Plan

- **Reconciliation test:** Automated query comparing `products.stock_quantity` vs `inventory.current_stock`, run before and after migration — should show zero drift after cutover.
- **Fractional-quantity test:** Sell 0.25kg of a weight-based product, confirm `inventory_transactions` logs it exactly (no rounding to 0).
- **Bulk-to-retail conversion test (New):** Purchase 1 unit at the largest conversion factor (e.g., 1 bag = 50,000g). Sell in smaller units (1kg, then 0.25kg, then 250g) against the same stock pool, per the worked example in Section 5.9. Confirm: (a) `current_stock` deducts correctly after each sale, (b) no separate "bag count" is tracked anywhere — only base-unit grams, (c) stock reaches exactly 0 after all 50kg is sold off in mixed kg/g portions with no rounding drift.
- **Pack-based product test (New):** Repeat the same conversion formula test for a `conversion_factor = 1` product (pesticide) to confirm the identical code path handles single-unit products with no special-casing.
- **Base unit integrity test (New):** Attempt to insert a `product_units` row set with zero or multiple `is_base_unit = true` rows for one product — both should be rejected by the constraint in Section 5.10. Attempt to insert mismatched `units.type` values (e.g., `weight` + `count`) for the same product and confirm it's rejected. Confirm `inventory.base_unit_id` cannot diverge from the product's designated base unit.
- **Price history test (New):** Edit a product's price twice; confirm the resolution of 5.10's `effective_from` decision — either prior prices are preserved as historical rows, or the column has been removed as dead schema. Either outcome is acceptable as long as it's deliberate, not silent data loss.
- **Concurrency test:** Simulate two simultaneous sales against a product with stock = 1; exactly one should succeed once row-locking is in place.
- **Cancellation atomicity test:** Force a failure mid-cancellation (e.g., invalid product mid-loop) and confirm no partial stock restoration occurs post-fix.
- **Regression test on `sale_items`:** Insert a sale with `item_type`/`product_unit_id`/`unit_name`, then read it back — confirm values persist correctly.

---

## 10. Open Questions (Must Resolve Before Finalizing)

1. What does `create_sale_transaction` actually do internally — does it lock rows, and does it write to `inventory` or `products`?
2. What does `adjust_inventory` actually do internally — same questions?
3. Does `sale_items` in the live database already have `item_type`, `product_unit_id`, `unit_name`, `workspace_id` columns via an unshown migration?
4. Should `products.stock_quantity` be fully removed, or retained as a denormalized cache for list-view performance?
5. What does `get_low_stock_products` RPC actually query — `products.min_stock_quantity` or `inventory.minimum_stock`?
6. **(New — pending business decision)** Does the UI need to display a "bags remaining" style breakdown (e.g., "2 bags + 15kg"), or is total base-unit weight (e.g., "115kg") sufficient? This is a presentation-layer decision only — it does not change the underlying data model in Section 5.9, since bag count is never stored as a discrete field regardless of the answer.

---

## 11. Risks If Not Addressed

- Shop owners see incorrect stock counts (silent drift between the two tables)
- Fractional sales of bulk/weight products (sugar, rice) can't be audited accurately
- Concurrent sales at low stock could oversell
- A failed cancellation could leave inventory in a corrupted, hard-to-diagnose state
- Future developers fixing a bug in one copy of duplicated auth/advance logic won't realize a second copy still has the bug
- If the conversion formula in Section 5.9 is not correctly implemented in the RPCs, bulk-unit products (sugar) will silently under- or over-deduct stock while single-unit products (pesticide, `conversion_factor = 1`) appear to work fine — masking the bug until a bulk-unit sale is made
- Without an enforced base unit (Section 5.10), a product could end up with an ambiguous or missing conversion root, making every stock calculation for that product unreliable in a way that's hard to detect until numbers look wrong
- `product_prices.effective_from` currently implies price history is tracked when it isn't — anyone relying on it for historical reporting will get silently incomplete data

---

## 12. Scope Note: Pricing Calculation (Not Covered by This TDD)

Per Section 3 Non-Goals, this document does not cover pricing logic (`price_per_kg × quantity` vs. `price_per_pack × quantity`). However, since pricing math shares the same "verify the RPC actually does this correctly" risk pattern as the stock-conversion issue in 5.4/5.9, it is flagged here as a related follow-up worth a separate, smaller review — not assumed to be correct by omission.

---

## 13. Definition of Done

This overhaul is considered complete when:
- [ ] All Section 10 open questions are answered and documented
- [ ] `inventory.current_stock` is the only table any application code writes stock changes to
- [ ] `inventory_transactions.quantity` is decimal and accurately logs every fractional movement
- [ ] `cancelSale` runs through a single atomic RPC with no partial-failure risk
- [ ] Row-level locking is confirmed present (or added) in all stock-mutating RPCs
- [ ] The Section 5.9 worked example passes as an automated test for both a multi-unit product (sugar) and a single-unit product (pesticide)
- [ ] Every product has exactly one `product_units` row with `is_base_unit = true`, and `inventory.base_unit_id` always matches it (Section 5.10)
- [ ] `is_default` (display) and `is_base_unit` (storage/conversion) are distinct fields, no longer conflated
- [ ] `product_prices.effective_from` is either functional (price history genuinely preserved) or removed as dead schema — a deliberate decision, documented
- [ ] `getAuthorizedUser` and advance-payment consumption logic each exist in exactly one place in the codebase
- [ ] `products.stock_quantity` is either removed or converted to a trigger-synced read cache, with zero direct writes from application code

---

## 14. Extension: Batch-Level Expiry Tracking

**Status:** Proposed extension — separate feature from the core stock-integrity fixes in Sections 5.1–5.10, but built on the same `inventory`/`inventory_transactions` foundation. Relevant for medical-store and bakery-style tenants where a single product can have multiple batches with different expiry dates.

### 14.1 Problem
`products.expiry_date` and `products.batch_number` are single fields on the product itself, not on the stock that arrived. Receiving a second shipment with a different expiry date has no way to coexist with the first — one field, one value, overwritten on every stock-in. This also means there's no way to sell older/soon-to-expire stock before newer stock (FEFO — First-Expiry-First-Out), which is close to a regulatory expectation for a medical store and good practice for a bakery.

### 14.2 Schema
```sql
CREATE TABLE product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT,
    expiry_date DATE,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity_received DECIMAL(14,3) NOT NULL CHECK (quantity_received > 0),
    quantity_remaining DECIMAL(14,3) NOT NULL CHECK (quantity_remaining >= 0),
    purchase_price DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_batches_product ON product_batches(product_id);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);
```
`inventory.current_stock` for a product becomes the sum of `quantity_remaining` across all its batches — same "ledger, not a single mutable number" principle used elsewhere in this document. Every purchase/stock-in creates a **new** `product_batches` row rather than overwriting a field.

### 14.3 FEFO Sale Logic
```
On sale of quantity Q for a batch-tracked product:
1. Fetch batches for the product, ordered by expiry_date ASC 
   (soonest first), where quantity_remaining > 0
2. Deduct from the oldest-expiring batch first
3. If Q exceeds that batch's quantity_remaining, spill over into 
   the next batch, and so on
4. Log each batch deduction separately in inventory_transactions, 
   with a batch_id reference column (requires adding 
   batch_id UUID REFERENCES product_batches(id) to inventory_transactions)
```

**Worked example:**
```
Batch A: expiry_date = 2026-08-15, quantity_remaining = 20
Batch B: expiry_date = 2026-11-01, quantity_remaining = 50

Sale of 25 units:
  → 20 units deducted from Batch A (now 0)
  → 5 units deducted from Batch B (now 45)
```

### 14.4 Expiry Alerts (Batch-Aware)
The existing `get_expiry_alerts` RPC (referenced by `getExpiryProducts` in the dashboard) must be rewritten to query `product_batches` instead of `products.expiry_date`, so alerts identify the specific batch at risk, not just "this product has some expiry date somewhere":
```sql
SELECT product_id, batch_number, expiry_date, quantity_remaining,
       expiry_date - CURRENT_DATE AS days_until_expiry
FROM product_batches
WHERE workspace_id = $1
  AND quantity_remaining > 0
  AND expiry_date <= CURRENT_DATE + ($2 || ' days')::INTERVAL
ORDER BY expiry_date ASC;
```

### 14.5 Expired Stock Write-Off
Expired stock with `quantity_remaining > 0` must not silently sit in `current_stock` forever. Add a write-off flow: a scheduled job or manual review screen flags batches past `expiry_date`, the shop owner confirms disposal, and the system zeroes out `quantity_remaining` on that batch while logging an `inventory_transactions` row with `transaction_type = 'adjustment'` and a `reason = 'expired'` value — feeding into loss/shrinkage reporting.

### 14.6 Interaction with Sections 5.9 / 5.10 (Unit Conversion)
Batch quantities must be tracked in the same base unit as `inventory.current_stock` (Section 5.9) — e.g., grams for sugar, packs for pesticide/medicine — so a batch received as "5 boxes" is stored as `quantity_received` in base units via the same `quantity_entered × conversion_factor` formula, not as a raw box count.

### 14.7 Testing Additions
- **FEFO deduction test:** Two batches with different expiry dates and quantities; sell a quantity spanning both; confirm deduction order and remaining quantities match the worked example in 14.3.
- **Batch-aware expiry alert test:** Confirm `get_expiry_alerts` surfaces the correct batch and quantity, not just a product-level flag.
- **Write-off test:** Confirm an expired batch with remaining stock can be written off, `current_stock` decreases accordingly, and the write-off is logged with a traceable reason.

### 14.8 Open Questions
1. Should `batch_number` be required on stock-in, or optional (useful for a bakery with informal/no supplier batch numbers)?
2. Does `product_batches` apply to every product, or should it be opt-in per product (e.g., a hardware store's screws don't need batch tracking, but a pharmacy's medicine does)?
3. Should purchase price differences between batches (Section 14.2's `purchase_price` field) feed into profit calculations per-batch, or continue using the product-level average as today?

### 14.9 Definition of Done (Extension)
- [ ] `product_batches` table exists and every stock-in creates a new batch row
- [ ] Sales deduct via FEFO across batches, spilling over correctly when one batch is insufficient
- [ ] `inventory_transactions` references the specific `batch_id` for batch-tracked products
- [ ] Expiry alerts are batch-level, not product-level
- [ ] Expired stock has a defined write-off flow, not left as silently stale `current_stock`

---

## 15. Frontend Architecture & Component Wiring

**Status:** Complete — all core inventory pages and forms are implemented and wired to backend RPCs via Server Actions.

### 15.1 Page Routes & Responsibilities

| Route | Component | Purpose | Data Source |
|---|---|---|---|
| `/inventory` | `app/(workspace)/inventory/page.tsx` | Dashboard with KPI cards (tracked products, inventory value, low stock, out of stock, recent movements) | Direct Supabase queries to `inventory`, `inventory_transactions`, `products` |
| `/inventory/current-stock` | `app/(workspace)/inventory/current-stock/page.tsx` | Full stock table showing product name, SKU, current stock, unit, minimum stock, and status | Direct Supabase query to `inventory` joined with `products` and `units` |
| `/inventory/adjustments` | `app/(workspace)/inventory/adjustments/page.tsx` | Manual stock adjustment form (increase/decrease with reason) | Fetches products with `inventory` records and their `base_unit_id` |
| `/inventory/history` | `app/(workspace)/inventory/history/page.tsx` | Complete transaction log with date, product, type, quantity, balance, and reference | Direct Supabase query to `inventory_transactions` ordered by `created_at DESC` |
| `/inventory/low-stock` | `app/(workspace)/inventory/low-stock/page.tsx` | Filtered list of products where `current_stock <= minimum_stock` | Direct Supabase query with client-side filter |
| `/inventory/alerts` | `app/(workspace)/inventory/alerts/page.tsx` | Combined view of expiry alerts and low-stock products | Calls `get_expiry_alerts` and `get_low_stock_products` RPCs |

### 15.2 Server Actions (API Layer)

All inventory mutations go through Server Actions in `actions/inventory.ts` and `actions/batch.ts`. No direct database writes from client components.

**`adjustInventory(workspaceId, values)`**
- **Schema:** `inventoryAdjustmentSchema` — requires `productId`, `direction` (increase/decrease), `quantity` (positive decimal), `reason` (required, max 500 chars)
- **RPC called:** `adjust_inventory` with parameters `p_workspace_id`, `p_product_id`, `p_direction`, `p_quantity`, `p_reason`, `p_user_id`
- **Revalidation:** `/inventory`, `/inventory/current-stock`, `/inventory/history`, `/inventory/low-stock`, `/`
- **Returns:** `{ success: boolean, message: string }`

**`stockInBatch(workspaceId, values)`**
- **Schema:** `stockInBatchSchema` — requires `productId`, `productUnitId`, `quantity` (positive decimal); optional `batchNumber`, `expiryDate`; requires `purchasePrice` (non-negative)
- **RPC called:** `stock_in_batch` with parameters `p_workspace_id`, `p_product_id`, `p_product_unit_id`, `p_quantity`, `p_batch_number`, `p_expiry_date`, `p_purchase_price`, `p_user_id`
- **Revalidation:** `/inventory`, `/inventory/current-stock`, `/inventory/history`, `/inventory/alerts`, `/`
- **Returns:** `{ success: boolean, message: string }`

**`writeOffExpiredBatch(workspaceId, batchId)`**
- **Schema:** No Zod validation — `batchId` is a UUID string
- **RPC called:** `write_off_expired_batch` with parameters `p_workspace_id`, `p_batch_id`, `p_user_id`
- **Revalidation:** `/inventory/alerts`, `/inventory/current-stock`, `/inventory/history`, `/`
- **Returns:** `{ success: boolean, message: string }`

### 15.3 Client Components

**`StockInForm`** (`features/inventory/components/stock-in-form.tsx`)
- **Used on:** `/inventory/adjustments` (currently — should be on a dedicated stock-in page per Section 14)
- **Props:** `workspaceId: string`, `products: ProductOption[]` (each with `id`, `name`, `units[]` containing `id`, `symbol`, `conversionFactor`)
- **Fields:** Product (select), Unit (select, disabled until product selected, shows `symbol (×conversionFactor)`), Quantity (number, min 0.001, step 0.001), Purchase price (number, min 0, step 0.01), Batch number (text), Expiry date (date)
- **Behavior:** On product change, resets unit selection. On success, resets entire form and clears product selection.
- **Calls:** `stockInBatch` Server Action

**`InventoryAdjustmentForm`** (`features/inventory/components/inventory-adjustment-form.tsx`)
- **Used on:** `/inventory/adjustments`
- **Props:** `workspaceId: string`, `products: { id, name, unit }[]` (filtered to products with inventory records, unit is the base unit symbol)
- **Fields:** Product (select with unit display), Adjustment type (select: increase/decrease), Quantity (number, min 0.001, step 0.001), Reason (text, required)
- **Calls:** `adjustInventory` Server Action

**`ExpiryAlertsClient`** (`app/(workspace)/inventory/alerts/expiry-alerts-client.tsx`)
- **Used on:** `/inventory/alerts`
- **Props:** `workspaceId`, `expiringProducts[]` (from `get_expiry_alerts` RPC), `lowStockProducts[]` (from `get_low_stock_products` RPC)
- **Features:**
  - Summary cards: Expired count, Expiring soon count, Low stock count
  - Expired products section with write-off button (calls `writeOffExpiredBatch` if `batch_id` present)
  - Expiring soon section (within 30 days)
  - Low stock section
  - Badges: Expired (red), Critical ≤7 days (red), Warning ≤30 days (yellow), Adequate (gray)
- **Calls:** `writeOffExpiredBatch` Server Action for batch write-off

### 15.4 Data Flow Diagrams

**Stock-In Flow:**
```
User fills StockInForm (client)
  → onSubmit calls stockInBatch Server Action
    → Validates against stockInBatchSchema
    → Calls getAuthorizedUser for auth
    → Calls stock_in_batch RPC (atomic DB transaction)
      → Applies quantity_entered × conversion_factor
      → Creates product_batches row (if batch tracking)
      → Updates inventory.current_stock
      → Inserts inventory_transactions row
    → Revalidates affected pages
  → Form resets on success
```

**Adjustment Flow:**
```
User fills InventoryAdjustmentForm (client)
  → onSubmit calls adjustInventory Server Action
    → Validates against inventoryAdjustmentSchema
    → Calls getAuthorizedUser for auth
    → Calls adjust_inventory RPC (atomic DB transaction)
      → Locks inventory row (SELECT ... FOR UPDATE)
      → Updates inventory.current_stock
      → Inserts inventory_transactions row with direction
    → Revalidates affected pages
  → Form resets on success
```

**Expiry Alert Write-Off Flow:**
```
User clicks write-off button in ExpiryAlertsClient
  → handleWriteOff calls writeOffExpiredBatch Server Action
    → Calls getAuthorizedUser for auth
    → Calls write_off_expired_batch RPC
      → Sets product_batches.quantity_remaining = 0
      → Inserts inventory_transactions with reason = 'expired'
    → Revalidates alerts and stock pages
  → Button disabled during operation
```

### 15.5 Schema Validation (Zod)

**`inventoryAdjustmentSchema`** (`schemas/inventory.ts`):
```typescript
{
  productId: string (UUID),
  direction: "increase" | "decrease",
  quantity: number (positive),
  reason: string (1-500 chars, trimmed)
}
```

**`stockInBatchSchema`** (`schemas/inventory.ts`):
```typescript
{
  productId: string (UUID),
  productUnitId: string (UUID),
  quantity: number (positive),
  batchNumber?: string (trimmed, optional),
  expiryDate?: string (optional),
  purchasePrice: number (>= 0)
}
```

### 15.6 Known Gaps & Future Work

1. **No inline stock editing on current-stock page:** The current-stock table has "Adjust" and "History" links but no quick-action buttons. Consider adding inline adjustment modals.

2. **No filtering on history page:** Cannot filter by product, transaction type, or date range. Should add URL-based filters.

3. **`get_low_stock_products` RPC returns `products` columns, not `inventory` columns:** The alerts page and low-stock page use different data sources (`get_low_stock_products` RPC vs direct `inventory` query). This should be unified to avoid drift (relates to Section 5.1's dual-source problem).

### 15.7 Completed Frontend Improvements

**Dual stock management flows:** 
- `/inventory/stock-in` — Receive new stock with batch tracking, expiry dates, and purchase price
- `/inventory/adjustments` — Manual stock adjustments (increase/decrease) with reason tracking

**Product search/autocomplete:** Replaced native `<select>` elements with `Combobox` component in both:
- `StockInForm` — product and unit selection with search
- `InventoryAdjustmentForm` — product selection with search

**Pagination on history page:** Added cursor-based pagination to `/inventory/history` with 50 rows per page, Previous/Next navigation, and page count display.

**Confirmation dialog for write-off:** Added `ConfirmDialog` component (`components/ui/confirm-dialog.tsx`) and integrated it into `ExpiryAlertsClient` for batch write-off actions.

**Unit display fix:** Fixed current-stock page to properly resolve `base_unit_id` to human-readable unit symbols via `unitNames` map.

**Dashboard navigation:** Updated inventory dashboard to show three buttons: "Stock in" (primary), "Adjust stock" (outline), and "View all stock" (ghost).

### 15.8 Revalidation Strategy

All Server Actions use `revalidatePath` from `next/cache` to invalidate Next.js cache for affected routes. The revalidation paths are hardcoded in each action:

- **adjustInventory:** `/inventory`, `/inventory/current-stock`, `/inventory/history`, `/inventory/low-stock`, `/`
- **stockInBatch:** `/inventory`, `/inventory/current-stock`, `/inventory/history`, `/inventory/alerts`, `/`
- **writeOffExpiredBatch:** `/inventory/alerts`, `/inventory/current-stock`, `/inventory/history`, `/`

**Note:** This is a path-based revalidation, not tag-based. If new inventory pages are added, all Server Actions must be updated to include the new paths. Consider migrating to `revalidateTag` for more maintainable cache invalidation.

---

## 16. Implementation Tickets

Each ticket maps to a section above. Tickets are ordered to respect dependencies — read-only investigation tickets first, since several design decisions (5.1, 5.10) can't be finalized until they're answered.

---

**TICKET-01: Review RPC internals — `create_sale_transaction` and `adjust_inventory`**
- **Type:** Investigation (read-only, no code change)
- **Priority:** Blocker — unblocks TICKET-03, 04, 08, 09
- **Related section:** 5.4
- **Description:** Pull and document the actual SQL for both RPCs. Confirm: (a) row-locking behavior, (b) which table(s) they write to (`inventory` vs `products.stock_quantity`), (c) whether they apply `quantity_entered × conversion_factor` correctly.
- **Acceptance criteria:** Both RPC bodies documented in Section 4/10; Open Questions 1–2 answered.
- **Effort:** Small

**TICKET-02: Reconciliation query — `products.stock_quantity` vs `inventory.current_stock`**
- **Type:** Investigation (read-only)
- **Priority:** Blocker — unblocks TICKET-08
- **Related section:** 7 (Data Migration Plan, step 1)
- **Description:** Write and run a query diffing both stock values per product to quantify current drift before any schema change.
- **Acceptance criteria:** Drift report produced; scale of the problem known.
- **Effort:** Small

**TICKET-03: Confirm live `sale_items` schema**
- **Type:** Investigation (read-only)
- **Priority:** Blocker — unblocks nothing else but must close before shipping any `sale_items` change
- **Related section:** 5.5
- **Description:** Run `\d sale_items` against the live DB to confirm whether `item_type`, `product_unit_id`, `unit_name`, `workspace_id` already exist via an unshown migration.
- **Acceptance criteria:** Open Question 3 answered; confirmed whether current inserts are silently failing.
- **Effort:** Small

**TICKET-04: Widen `inventory_transactions.quantity` to `DECIMAL(14,3)`**
- **Type:** Schema migration
- **Priority:** Critical
- **Related section:** 5.2
- **Depends on:** TICKET-01
- **Description:** `ALTER TABLE inventory_transactions ALTER COLUMN quantity TYPE DECIMAL(14,3)`. Confirm no app code assumes integer rounding on this field.
- **Acceptance criteria:** Fractional-quantity test (Section 9) passes.
- **Effort:** Small

**TICKET-05: Extract shared `getAuthorizedUser` helper**
- **Type:** Refactor
- **Priority:** Medium
- **Related section:** 5.6
- **Depends on:** None
- **Description:** Move the duplicated logic from `payments.ts`, `products.ts`, `sales.ts`, `inventory.ts` into `lib/auth/workspace.ts`; update all four call sites.
- **Acceptance criteria:** Single implementation exists; no behavior change; all four modules import it.
- **Effort:** Small

**TICKET-06: Extract shared advance-payment consumption helper**
- **Type:** Refactor
- **Priority:** Medium
- **Related section:** 5.7
- **Depends on:** None
- **Description:** Consolidate the "consume oldest advance payments first" logic from `createSale` and `createPayment` into one `consumeAdvancePayments(workspaceId, customerId, amount)` function.
- **Acceptance criteria:** Both call sites use the shared function; fallback behavior is identical in both paths.
- **Effort:** Medium

**TICKET-07: Build `cancel_sale_transaction` RPC; rewire `cancelSale`**
- **Type:** Feature / bug fix
- **Priority:** Critical
- **Related section:** 5.3
- **Depends on:** TICKET-01, TICKET-04
- **Description:** Replace `cancelSale`'s per-item select/update/insert loop with a single atomic Postgres transaction mirroring `create_sale_transaction`'s pattern.
- **Acceptance criteria:** Cancellation atomicity test (Section 9) passes — forced mid-loop failure leaves no partial stock restoration.
- **Effort:** Medium

**TICKET-08: Consolidate stock source — deprecate `products.stock_quantity`**
- **Type:** Schema migration + refactor
- **Priority:** Critical
- **Related section:** 5.1, Data Migration Plan (7)
- **Depends on:** TICKET-01, TICKET-02, TICKET-07
- **Description:** Redirect all remaining reads/writes to `inventory.current_stock`. Rename `products.stock_quantity` → `stock_quantity_legacy`. Decide and implement: drop entirely, or trigger-synced read cache.
- **Acceptance criteria:** Reconciliation test shows zero drift; Open Question 4 answered and implemented.
- **Effort:** Large

**TICKET-09: Add row-level locking to stock-mutating RPCs**
- **Type:** Bug fix
- **Priority:** Critical
- **Related section:** 5.8
- **Depends on:** TICKET-01
- **Description:** Add `SELECT ... FOR UPDATE` (or equivalent) on the relevant `inventory` row inside `create_sale_transaction`, `adjust_inventory`, and the new `cancel_sale_transaction`, if not already present.
- **Acceptance criteria:** Concurrency test (Section 9) passes — exactly one of two simultaneous sales against stock = 1 succeeds.
- **Effort:** Medium

**TICKET-10: `product_units` schema fix — enforce base unit**
- **Type:** Schema migration
- **Priority:** Critical
- **Related section:** 5.10
- **Depends on:** None (can run in parallel with TICKET-01–04)
- **Description:** Add `is_base_unit` column and uniqueness constraint; separate it from `is_default`; tie `inventory.base_unit_id` to the product's base unit via trigger; add a type-consistency check across a product's units.
- **Acceptance criteria:** Base unit integrity test (Section 9) passes.
- **Effort:** Medium

**TICKET-11: Resolve `product_prices.effective_from` — implement or remove**
- **Type:** Decision + schema/refactor
- **Priority:** Medium
- **Related section:** 5.10
- **Depends on:** TICKET-10
- **Description:** Decide whether price history is a real requirement. If yes, stop deleting `product_units`/`product_prices` on edit — insert new versioned rows instead. If no, remove `effective_from`.
- **Acceptance criteria:** Price history test (Section 9) passes with a deliberate, documented outcome either way.
- **Effort:** Medium

**TICKET-12: Verify/implement conversion formula in RPCs — worked example**
- **Type:** Bug fix / verification
- **Priority:** Critical
- **Related section:** 5.9
- **Depends on:** TICKET-01, TICKET-10
- **Description:** Confirm `create_sale_transaction` and `adjust_inventory` apply `quantity_entered × conversion_factor` identically for multi-unit (sugar) and single-unit (pesticide) products, with no product-type branching.
- **Acceptance criteria:** Bulk-to-retail conversion test and pack-based product test (Section 9) both pass.
- **Effort:** Medium

**TICKET-13 (Extension): Batch tracking schema — `product_batches`**
- **Type:** Feature (new table)
- **Priority:** High (only if expiry tracking is in scope for this release)
- **Related section:** 14.2
- **Depends on:** TICKET-08, TICKET-10 (needs a stable base-unit system first)
- **Description:** Create `product_batches` table; wire stock-in flows to insert a new batch row per purchase instead of overwriting `products.expiry_date`.
- **Acceptance criteria:** Every stock-in creates a batch row; `inventory.current_stock` equals the sum of batch `quantity_remaining`.
- **Effort:** Large

**TICKET-14 (Extension): FEFO sale deduction logic**
- **Type:** Feature
- **Priority:** High
- **Related section:** 14.3
- **Depends on:** TICKET-13
- **Description:** Implement sale-time deduction ordered by soonest `expiry_date` first, spilling into subsequent batches as needed; add `batch_id` reference to `inventory_transactions`.
- **Acceptance criteria:** FEFO deduction test (14.7) passes.
- **Effort:** Large

**TICKET-15 (Extension): Batch-aware expiry alerts**
- **Type:** Feature
- **Priority:** Medium
- **Related section:** 14.4
- **Depends on:** TICKET-13
- **Description:** Rewrite `get_expiry_alerts` to query `product_batches` instead of `products.expiry_date`.
- **Acceptance criteria:** Batch-aware expiry alert test (14.7) passes.
- **Effort:** Small

**TICKET-16 (Extension): Expired stock write-off flow**
- **Type:** Feature
- **Priority:** Medium
- **Related section:** 14.5
- **Depends on:** TICKET-13, TICKET-14
- **Description:** Build the manual/scheduled flow to flag expired batches with remaining stock and log a write-off adjustment.
- **Acceptance criteria:** Write-off test (14.7) passes.
- **Effort:** Medium

---

### Suggested Execution Order
```
Phase 1 (Investigation, parallel):   TICKET-01, 02, 03
Phase 2 (Foundational fixes):        TICKET-04, 05, 06, 10
Phase 3 (Core integrity):            TICKET-07, 08, 09, 11, 12
Phase 4 (Expiry extension, optional):TICKET-13 → 14 → 15, 16
```