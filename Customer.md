# Customer Module Requirements

## Overview

The Customer module is the core of the Khata application. It stores customer information, tracks purchases and payments, and provides a complete financial overview for each customer.

---

# Objectives

- Manage customer information.
- Maintain customer purchase history.
- Maintain customer payment history.
- Calculate the customer's pending balance.
- Display a complete customer profile.
- Prepare the system for future Invoice, Product, and Payment modules.

---

# Customer Form

## Required Fields

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| First Name | Text | ✅ | Customer first name |
| Last Name | Text | ✅ | Customer last name |
| Phone Number | Text | ✅ | Must be unique |

## Optional Fields

| Field | Type | Description |
|---------|------|-------------|
| Address | Textarea | Customer address |
| City | Text | Customer city |
| Notes | Textarea | Additional notes |

---

# Validation Rules

## First Name

- Required
- Minimum 2 characters
- Maximum 50 characters

## Last Name

- Required
- Minimum 2 characters
- Maximum 50 characters

## Phone Number

- Required
- Must be unique
- Numbers only

## Address

- Optional

## City

- Optional

## Notes

- Optional
- Maximum 500 characters

---

# Customer List

Display the following information.

| Column |
|---------|
| Customer Name |
| Phone Number |
| City |
| Pending Balance |
| Total Purchases |
| Total Paid |
| Last Purchase Date |
| Last Payment Date |
| Status |
| Actions |

---

## Available Actions

- View
- Edit
- Soft Delete

---

# Customer Details Page

## Customer Information

Display

- Full Name
- Phone Number
- Address
- City
- Notes
- Customer Since (Created Date)

---

## Financial Summary

Display summary cards.

| Card |
|------|
| Pending Balance |
| Total Purchases |
| Total Paid |
| Total Orders |
| Last Purchase Date |
| Last Payment Date |

---

## Purchase History

Display every purchased product.

| Invoice | Date | Product | Quantity | Unit Price | Total |
|----------|------|---------|-----------|------------|-------|

### Features

- Search
- Date Filter
- Pagination
- View Invoice

---

## Payment History

Display every payment made by the customer.

| Date | Amount | Against Invoice | Payment Method | Notes |
|------|--------|-----------------|----------------|-------|

### Example

| Date | Amount | Against |
|------|--------|----------|
| 04 Jul | Rs. 2,000 | INV-001 |
| 08 Jul | Rs. 1,500 | INV-002 |

---

## Running Khata (Ledger)

Display all purchases and payments in chronological order.

| Date | Description | Debit | Credit | Balance |
|------|-------------|--------|---------|----------|

### Example

| Date | Description | Debit | Credit | Balance |
|------|-------------|--------|---------|----------|
| 01 Jul | Purchase (INV-001) | 5,000 | - | 5,000 |
| 03 Jul | Payment | - | 2,000 | 3,000 |
| 06 Jul | Purchase (INV-002) | 1,500 | - | 4,500 |

---

# Search

Search customers by:

- First Name
- Last Name
- Full Name
- Phone Number

---

# Filters

- City
- Pending Balance
- Active Customers
- Inactive Customers

---

# Sorting

- Customer Name
- Pending Balance
- Created Date
- Last Purchase Date
- Last Payment Date

---

# Business Rules

## Customer

- Phone number must be unique.
- Customers with the same name are allowed.
- Use soft delete instead of permanent delete.

## Pending Balance

The Pending Balance is the amount the customer still owes.

Formula:

Pending Balance = Total Purchases - Total Payments

### Example

| Description | Amount |
|------------|--------:|
| Total Purchases | Rs. 25,000 |
| Total Paid | Rs. 18,000 |
| **Pending Balance** | **Rs. 7,000** |

---

# Database Schema

## customers

| Column | Type |
|---------|------|
| id | UUID |
| first_name | Text |
| last_name | Text |
| phone | Text (Unique) |
| address | Text |
| city | Text |
| notes | Text |
| status | Active / Inactive |
| created_at | Timestamp |
| updated_at | Timestamp |
| deleted_at | Timestamp (Nullable) |

---

# Future Relationships

Customer

- One Customer → Many Invoices
- One Customer → Many Payments
- One Customer → Many Ledger Entries

---

# Future Modules

The Customer module will integrate with:

- Product Module
- Invoice Module
- Payment Module
- Khata Ledger
- Reports
- Dashboard

---

# Development Notes

- Do **not** store the Pending Balance in the `customers` table.
- Calculate the Pending Balance from purchase and payment records.
- Keep Purchase History and Payment History in separate sections.
- Use UUID as the primary key.
- Use soft delete to preserve historical data.
- Design the Customer Details page so it can easily display invoices, products, payments, and the running Khata as those modules are added.