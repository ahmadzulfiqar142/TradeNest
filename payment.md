I'll recommend rebuilding around a **Sales-first architecture** instead of a **Payment-first architecture**. This follows standard accounting principles and will make future features (advance payments, partial payments, returns, reporting, inventory, etc.) much easier to implement.

# Khata Management System - Architecture Design

## Version

**v2.0**

---

# Overview

The current implementation combines **Sale** and **Payment** into a single entity.

This causes several limitations:

* Cannot record advance payments.
* Cannot support partial payments.
* Product information is stored inside the payment.
* Difficult to support refunds.
* Difficult to support multiple payment methods.
* Ledger becomes complicated.

The new architecture separates **Sales** from **Payments**.

---

# Core Principles

## 1. Sale

A sale represents products that were sold.

A sale answers:

> **What was sold?**

---

## 2. Payment

A payment represents money received.

A payment answers:

> **How much money was received?**

---

## 3. Customer Ledger

A ledger represents the financial history of a customer.

A ledger answers:

> **What is the customer's current balance?**

---

# Architecture

```
Customer
    │
    ├──────────────┐
    │              │
    ▼              ▼
 Sales         Payments
    │              │
    ▼              │
Sale Items         │
    │              │
    └──────┬───────┘
           ▼
     Customer Ledger
```

---

# Modules

```
Customers

Products

Sales

Payments

Inventory

Ledger

Reports
```

---

# Database Design

## customers

```sql
id uuid primary key

name text

phone text

address text

created_at timestamptz
```

---

## products

```sql
id uuid primary key

name text

sku text

selling_price numeric

stock_quantity integer

created_at timestamptz
```

---

## sales

Represents an invoice.

```sql
id uuid primary key

customer_id uuid references customers(id)

invoice_number text

subtotal numeric

discount numeric

total numeric

status text

sale_date date

notes text

created_at timestamptz
```

---

## sale_items

Every sold product.

```sql
id uuid primary key

sale_id uuid references sales(id)

product_id uuid references products(id)

quantity integer

unit_price numeric

total numeric
```

---

## payments

Stores only money transactions.

```sql
id uuid primary key

customer_id uuid references customers(id)

sale_id uuid references sales(id)

amount numeric

payment_method text

payment_date date

reference_number text

notes text

created_at timestamptz
```

> **sale_id should be nullable** to support advance payments.

---

# Relationships

```
Customer

│

├── Sales

│     └── Sale Items

│

└── Payments
```

---

# Sale Status

```
PENDING

PARTIALLY_PAID

PAID

CANCELLED
```

---

# Payment Methods

```
Cash

Bank Transfer

JazzCash

EasyPaisa

Debit Card

Credit Card

Cheque

Other
```

---

# Business Flow

## Case 1 — Cash Sale

Customer buys:

```
Rice

2 x 500
```

Invoice

```
1000
```

Customer pays

```
1000
```

Creates

```
Sale

Payment
```

Invoice status

```
PAID
```

---

## Case 2 — Credit Sale

Invoice

```
5000
```

Customer pays

```
0
```

Creates

```
Sale
```

Outstanding

```
5000
```

Invoice status

```
PENDING
```

---

## Case 3 — Partial Payment

Invoice

```
10000
```

Customer pays

```
3000
```

Creates

```
Sale

Payment
```

Outstanding

```
7000
```

Invoice status

```
PARTIALLY_PAID
```

---

## Case 4 — Multiple Payments

Invoice

```
10000
```

Payment 1

```
3000
```

Payment 2

```
2000
```

Payment 3

```
5000
```

Invoice automatically becomes

```
PAID
```

---

## Case 5 — Advance Payment

Customer deposits

```
10000
```

No invoice exists.

Create only

```
Payment

sale_id = NULL
```

Customer balance

```
Advance

10000
```

Later

Invoice

```
4000
```

Advance automatically becomes

```
6000
```

---

# Customer Balance Calculation

## Total Sales

```sql
SUM(sales.total)
```

---

## Total Payments

```sql
SUM(payments.amount)
```

---

## Net Balance

```
Balance = Total Payments - Total Sales
```

### Positive

```
Customer has Advance Balance
```

### Zero

```
Customer is Settled
```

### Negative

```
Customer has Outstanding Balance
```

---

# Customer Detail Screen

```
Customer Information

---------------------------------

Name

Phone

Address

---------------------------------

Summary

Total Sales

Total Payments

Advance Balance

Outstanding Balance

---------------------------------

Invoices

---------------------------------

Payments

---------------------------------

Ledger
```

---

# Customer Ledger Example

| Date   | Type            | Reference |  Debit | Credit | Running Balance |
| ------ | --------------- | --------- | -----: | -----: | --------------: |
| 01 Jul | Advance Payment | PAY-001   | 10,000 |      0 |          10,000 |
| 03 Jul | Sale            | INV-001   |      0 |  5,000 |           5,000 |
| 05 Jul | Sale            | INV-002   |      0 |  2,000 |           3,000 |
| 08 Jul | Payment         | PAY-002   |  1,000 |      0 |           4,000 |

**Ledger Rules**

* **Debit (+):** Money received from the customer (payments, advance payments).
* **Credit (-):** Value of goods sold (sales/invoices).
* **Running Balance > 0:** Customer has advance credit.
* **Running Balance < 0:** Customer owes money.

---

# API Structure

```
/customers

/products

/sales

/payments

/ledger

/reports
```

---

# Folder Structure

```
src/

modules/
│
├── customers/
│
├── products/
│
├── sales/
│   ├── actions/
│   ├── components/
│   ├── validations/
│   ├── services/
│   ├── repositories/
│   └── types/
│
├── payments/
│   ├── actions/
│   ├── components/
│   ├── validations/
│   ├── services/
│   └── repositories/
│
├── ledger/
│
├── inventory/
│
└── reports/
```

---

# Recommended Tech Stack

* **Frontend:** Next.js 15 (App Router), React, TypeScript
* **Backend:** Next.js Server Actions
* **Database:** Supabase PostgreSQL
* **Authentication:** Supabase Auth
* **Validation:** Zod
* **Forms:** React Hook Form
* **State Management:** TanStack Query (optional) + Server Actions
* **UI:** shadcn/ui + Tailwind CSS
* **Tables:** TanStack Table
* **Charts:** Recharts

---

# Future Features Supported

* ✅ Multiple products per invoice
* ✅ Multiple payments per invoice
* ✅ Partial payments
* ✅ Advance customer deposits
* ✅ Customer refunds
* ✅ Product returns
* ✅ Invoice discounts
* ✅ Taxes (GST/VAT)
* ✅ Inventory management
* ✅ Customer ledger
* ✅ Daily/monthly sales reports
* ✅ Outstanding reports
* ✅ Advance balance reports
* ✅ Supplier management
* ✅ Purchase module
* ✅ Expense management
* ✅ Audit logs

---

# Migration Plan

1. Create new `sales` and `sale_items` tables.
2. Create the new `payments` table with `sale_id` nullable.
3. Migrate existing combined payment records into `sales` and `payments`.
4. Update inventory logic to deduct stock from `sale_items`.
5. Generate customer balances from `sales` and `payments` instead of storing balances.
6. Build the customer ledger view using a unified transaction timeline.
7. Remove the legacy combined payment implementation after verifying migrated data.

---

# Conclusion

This architecture follows standard accounting and POS design principles by separating **sales** (what was sold) from **payments** (money received). It is scalable, easier to maintain, and provides a solid foundation for future modules like purchases, suppliers, expenses, returns, and advanced financial reporting without requiring major database redesigns.
