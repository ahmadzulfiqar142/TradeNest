# Custom Line Items Implementation

## Overview
This document describes the custom line items feature for TradeNest sales, allowing users to add items that don't exist in the products catalog.

## Feature Description
Users can now add custom line items to sales invoices by:
1. Typing a custom name in the product search field
2. Selecting "Add [custom name] as a new line item" from the dropdown
3. Setting quantity, price, and discount for the custom item

Custom items are stored with `product_id = NULL` in the database and don't affect inventory.

## Implementation Status

### ✅ Frontend (Already Implemented)
- **File**: `features/sales/components/sale-form.tsx`
- **Status**: Complete
- **Details**:
  - Autocomplete component supports custom item creation via `allowCustom` prop
  - `addLineItem()` creates items with `isCustom: true`
  - `selectProductForItem()` sets `isCustom: false` when product selected
  - `setItemCustomName()` sets `isCustom: true` with custom name
  - Form schema includes `isCustom` field in sale item schema

### ✅ Autocomplete Component (Updated)
- **File**: `components/ui/autocomplete.tsx`
- **Status**: Updated to match MUI-style behavior
- **Details**:
  - Custom create option now appears at the **top** of the dropdown list
  - Shows "+ Add [custom name] as a new line item" with secondary text
  - Separated from product options by a visual divider
  - Matches MUI Autocomplete's "Create" option behavior
  - **Type Badge**: Shows "Product" (blue) or "One-time" (orange) badge in the input field
  - Badge clearly indicates whether the selected item is a catalog product or custom item

### ✅ Backend Actions (Already Implemented)
- **File**: `actions/sale.ts`
- **Status**: Complete
- **Details**:
  - `createSale()` handles custom items by setting `productId: null` when `isCustom` is true
  - `updateSale()` handles custom items similarly
  - Both functions pass correct data to RPC function

### ✅ Database RPC Function (Already Implemented)
- **File**: `supabase/migrations/v3_improvements.sql`
- **Status**: Complete
- **Details**:
  - `create_sale_transaction()` RPC function supports NULL product_id
  - Skips stock validation for custom items (line 53-54)
  - Inserts custom items with `product_id = NULL` (line 118-132)
  - No inventory transactions created for custom items

### ✅ Frontend Pages (Already Implemented)
- **Files**:
  - `app/(workspace)/sales/new/page.tsx` - New sale page
  - `app/(workspace)/sales/[saleId]/edit/page.tsx` - Edit sale page
  - `app/(workspace)/sales/[saleId]/page.tsx` - Sale details page
- **Status**: Complete
- **Details**:
  - All pages pass `products` prop to SaleForm
  - Sale details page displays custom items correctly (shows product_name)
  - No changes needed

### ⚠️ Database Schema (Needs Migration)
- **File**: `supabase/schema.sql` (line 168)
- **Status**: Migration created, needs to be run
- **Issue**: `product_id` column is `NOT NULL` in `sale_items` table
- **Solution**: Migration file created at `supabase/migrations/make_sale_items_product_id_nullable.sql`

## Migration Required

Run the following migration to enable custom line items:

```sql
-- File: supabase/migrations/make_sale_items_product_id_nullable.sql

-- Make product_id nullable in sale_items to support custom line items
ALTER TABLE sale_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL
ALTER TABLE sale_items
  DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey,
  ADD CONSTRAINT sale_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sale_items_product
  ON sale_items(product_id)
  WHERE product_id IS NOT NULL;
```

## How to Apply Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
supabase migration up
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL from `supabase/migrations/make_sale_items_product_id_nullable.sql`
4. Click "Run" to execute

### Option 3: Using psql
```bash
psql -U postgres -d your_database -f supabase/migrations/make_sale_items_product_id_nullable.sql
```

## How It Works

### Frontend Flow
1. User clicks "Add line item" button
2. New row appears with empty product field
3. User types custom name in autocomplete field
4. Autocomplete shows "Add [name] as a new line item" option
5. User selects custom option
6. Item is marked as `isCustom: true` with `productId: null`
7. User enters quantity, price, and discount
8. Total is calculated automatically
9. On form submit, item data is sent to backend

### Backend Flow
1. Form data received by `createSale()` or `updateSale()`
2. Items mapped to RPC format with `productId: null` for custom items
3. RPC function `create_sale_transaction()` processes items:
   - Custom items (productId IS NULL): Inserted directly, no stock validation
   - Regular items (productId IS NOT NULL): Stock validated and deducted
4. Sale created with mixed custom and regular items

### Database Flow
1. Sale record created in `sales` table
2. Custom items inserted into `sale_items` with `product_id = NULL`
3. Regular items inserted with `product_id` referencing products table
4. Inventory transactions created only for regular items
5. Customer ledger updated for the sale total

## Data Structure

### Sale Item (Form)
```typescript
{
  productId: string | null;      // null for custom items
  productName: string;           // Required, the custom name or product name
  quantity: number;              // Required, min 1
  unitPrice: number;             // Required, min 0
  discount: number;              // Optional, 0-100
  total: number;                 // Calculated: quantity * unitPrice * (1 - discount/100)
  unit: string | null;           // Optional unit
  isCustom: boolean;             // true for custom items, false for products
}
```

### Sale Item (Database)
```sql
{
  id: UUID
  workspace_id: UUID
  sale_id: UUID
  product_id: UUID | NULL        -- NULL for custom items
  product_name: TEXT             -- The name to display
  quantity: INTEGER
  unit_price: DECIMAL
  discount: DECIMAL
  total: DECIMAL
  created_at: TIMESTAMP
}
```

## Testing Checklist

- [ ] Apply the database migration
- [ ] Create a new sale with only custom items
- [ ] Create a new sale with mix of custom and product items
- [ ] Create a new sale with only product items (existing behavior)
- [ ] Edit a sale to add custom items
- [ ] Edit a sale to convert product items to custom items
- [ ] Verify custom items display correctly on sale details page
- [ ] Verify inventory is not affected by custom items
- [ ] Verify inventory is affected by regular product items
- [ ] Test with customer attached
- [ ] Test with walk-in customer (no customer)
- [ ] Test with advance payment
- [ ] Verify totals calculate correctly with custom items
- [ ] Test discount application on custom items

## Benefits

1. **Flexibility**: Users can add any item to a sale, even if not in catalog
2. **No Inventory Impact**: Custom items don't affect stock levels
3. **Seamless UX**: Users can switch between products and custom items easily
4. **Data Integrity**: Custom items are clearly marked and tracked
5. **Backward Compatible**: Existing sales and products continue to work normally

## Notes

- Custom items are identified by `product_id IS NULL` in the database
- The `isCustom` flag is used in the frontend and backend logic
- Custom items cannot be converted to products automatically (by design)
- Inventory transactions are only created for items with valid product_id
- The RPC function already handles all the logic; only the database constraint needed updating