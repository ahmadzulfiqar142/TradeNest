Yes. According to the new architecture, I would **completely redesign the Customer Detail page**. Right now it is still based on the old model where a Payment also contains product information. That coupling should be removed.

## Problems with the current Customer Detail page

### 1. Transaction History is incorrect

Currently you're merging Sales and Payments like this:

```ts
Transaction History

Purchase
Payment
Purchase
Payment
```

But you're trying to display

* Product
* Qty

for **Payment** rows.

A payment **doesn't have products**.

So this code should disappear:

```ts
product: payment.notes?.includes("Product:")
quantity: payment.quantity
```

A payment should only show:

```
Date

Reference

Payment Method

Amount
```

---

## 2. Summary cards

Current

```
Total Purchases

Total Paid

Remaining Balance

Pending Amount
```

Recommended

```
Total Sales

Total Payments

Outstanding Balance

Advance Balance
```

Where

```
Outstanding Balance =
max(0, TotalSales - TotalPayments)

Advance Balance =
max(0, TotalPayments - TotalSales)
```

Never show negative values.

---

## 3. Transaction History

Instead of trying to make one table show everything, build a proper ledger.

Example

| Date  | Type            | Reference | Debit | Credit | Balance |
| ----- | --------------- | --------- | ----: | -----: | ------: |
| 1 Jul | Advance Payment | PAY-001   | 10000 |      0 |   10000 |
| 3 Jul | Sale            | INV-001   |     0 |   5000 |    5000 |
| 5 Jul | Payment         | PAY-002   |  2000 |      0 |    7000 |
| 8 Jul | Sale            | INV-002   |     0 |   9000 |   -2000 |

Where

Debit = Money received

Credit = Sale amount

Running Balance

Positive

```
Customer Credit
```

Negative

```
Customer Owes Money
```

This table becomes the **source of truth**.

---

## 4. Purchase History

Keep it.

```
Invoice

Date

Products

Qty

Total

Paid

Remaining

Status
```

Example

```
INV-001

Rice x2

Sugar x1

5000

Paid

0
```

---

## 5. Payment History

Keep it separate.

```
Date

Receipt

Method

Amount

Applied To

Reference
```

Example

```
5 Jul

REC-001

Cash

5000

INV-001
```

or

```
Advance Payment

Applied To

--

sale_id = NULL
```

---

## 6. Customer Header

I would redesign it.

```
Ali Ahmad

Phone

Address

Member Since

--------------------------------

Outstanding

Rs. 2,000

OR

Advance Balance

Rs. 5,000
```

Not both.

---

## 7. Activity Timeline

Instead of

```
Customer Created

Purchase

Payment
```

Make it richer.

```
Customer Created

Invoice Created

Payment Received

Advance Payment

Invoice Paid

Invoice Completed

Refund

Adjustment
```

---

# New Component Structure

```
Customer Detail

│

├── Customer Header

│

├── Financial Summary

│

├── Ledger (Most Important)

│

├── Purchase History

│

├── Payment History

│

├── Outstanding Invoices

│

└── Activity Timeline
```

---

# Data Flow

```
Customer

↓

Sales

↓

Sale Items

↓

Payments

↓

Ledger Generator

↓

Customer Detail UI
```

Notice

The UI should **never calculate balances itself**.

Instead the server returns

```ts
interface CustomerSummary {
    totalSales: number;

    totalPayments: number;

    outstandingBalance: number;

    advanceBalance: number;

    invoiceCount: number;

    paymentCount: number;

    lastSaleDate: string | null;

    lastPaymentDate: string | null;
}
```

---

# New TypeScript Models

I would also replace your current models with something cleaner.

```ts
interface CustomerFinancialSummary {
    totalSales: number;

    totalPayments: number;

    outstandingBalance: number;

    advanceBalance: number;

    totalInvoices: number;

    totalPaymentsReceived: number;
}
```

```ts
interface InvoiceHistory {
    id: string;

    invoiceNumber: string;

    saleDate: string;

    total: number;

    paidAmount: number;

    remainingAmount: number;

    status: "PENDING" | "PARTIALLY_PAID" | "PAID";
}
```

```ts
interface PaymentHistory {
    id: string;

    receiptNumber: string;

    paymentDate: string;

    amount: number;

    paymentMethod: PaymentMethod;

    saleId?: string | null;

    saleNumber?: string | null;
}
```

```ts
interface LedgerEntry {
    id: string;

    date: string;

    type:
        | "SALE"
        | "PAYMENT"
        | "ADVANCE"
        | "REFUND"
        | "ADJUSTMENT";

    reference: string;

    debit: number;

    credit: number;

    balance: number;

    description: string;
}
```

## My recommendation

I would **not patch the existing Customer Detail page**. It was designed around the old architecture where `Payment` contained product information.

Instead, treat this as a **v2 redesign**:

1. **Customer Header** (profile + current financial position)
2. **Financial Summary** (sales, payments, outstanding/advance)
3. **Running Ledger** (primary financial view)
4. **Invoices / Purchase History**
5. **Payment History**
6. **Activity Timeline**

This aligns perfectly with the new Sales + Payments architecture and will scale naturally when you add **partial payments, advance deposits, refunds, supplier accounts, and inventory**.