// Data transformation utilities for customer details page

// Original data types from database
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string | null;
  city: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  sale_date: string;
  payment_status: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
  sales: {
    sale_date: string;
    invoice_number: string;
  };
}

export interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  reference_type: string;
  reference_id: string;
}

export interface LedgerEntryDB {
  id: string;
  transaction_type: string;
  reference_type: string | null;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  transaction_date: string;
}

export interface Summary {
  totalPurchases: number;
  totalPaid: number;
  remainingBalance: number;
  pendingAmount: number;
  totalOrders: number;
  lastPurchaseDate: string | null;
  lastPaymentDate: string | null;
}

// Transformed data types for UI
export interface CustomerDetail {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  joinDate: string;
  status: "active" | "inactive" | "pending";
  totalPurchases: number;
  totalPaid: number;
  balance: number;
}

export interface PurchaseRecord {
  id: string;
  date: string;
  invoiceNo: string;
  items: number;
  amount: number;
  status: "completed" | "pending" | "cancelled";
}

export interface PaymentRecord {
  id: string;
  date: string;
  refNo: string;
  method: string;
  amount: number;
  status: "completed" | "pending" | "failed";
}

export interface LedgerEntry {
  id: string;
  transaction_type: string;
  reference_type: string | null;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ActivityTimelineEntry {
  id: string;
  type: "purchase" | "payment" | "communication" | "note";
  action: string;
  details: string;
  date: string;
}

// Transform customer data
export function transformCustomer(customer: any): CustomerDetail {
  return {
    id: customer.id,
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    company: customer.company || "Individual",
    email: customer.email || "No email",
    phone: customer.phone || "No phone",
    city: customer.city || "Unknown",
    country: customer.country || "Unknown",
    joinDate: customer.created_at,
    status: customer.status?.toLowerCase() || "active",
    totalPurchases: 0,
    totalPaid: 0,
    balance: 0,
  };
}

// Transform sales data to purchase records
export function transformPurchases(
  sales: any[],
  saleItems: any[],
): PurchaseRecord[] {
  return sales.map((sale) => {
    const items = saleItems.filter((item) => item.sale_id === sale.id);
    return {
      id: sale.id,
      date: sale.sale_date,
      invoiceNo: sale.invoice_number,
      items: items.length,
      amount: Number(sale.total),
      status: sale.payment_status?.toLowerCase() || "pending",
    };
  });
}

// Transform payments data
export function transformPayments(
  payments: any[],
  sales: any[],
): PaymentRecord[] {
  return payments.map((payment) => {
    const sale = sales.find((s) => s.id === payment.reference_id);
    return {
      id: payment.id,
      date: payment.payment_date,
      refNo: sale?.invoice_number || payment.reference_id,
      method: payment.payment_method?.replace(/_/g, " ") || "Unknown",
      amount: Number(payment.amount),
      status: "completed", // Default to completed since we don't have status in payments
    };
  });
}

// Transform ledger data
export function transformLedger(ledger: any[]): LedgerEntry[] {
  return ledger.map((entry) => ({
    id: entry.id,
    transaction_type: entry.transaction_type,
    reference_type: entry.reference_type,
    date: entry.transaction_date,
    description: entry.description,
    debit: Number(entry.debit),
    credit: Number(entry.credit),
    balance: Number(entry.balance),
  }));
}

// Generate activity timeline from all data
export function generateActivityTimeline(
  sales: any[],
  payments: any[],
  customer: any,
): ActivityTimelineEntry[] {
  const activities: ActivityTimelineEntry[] = [];

  // Add sales as purchase activities
  sales.forEach((sale) => {
    activities.push({
      id: `purchase-${sale.id}`,
      type: "purchase",
      action: "New Purchase",
      details: `Invoice ${sale.invoice_number} - $${Number(sale.total).toLocaleString()}`,
      date: sale.sale_date,
    });
  });

  // Add payments as payment activities
  payments.forEach((payment) => {
    activities.push({
      id: `payment-${payment.id}`,
      type: "payment",
      action: "Payment Received",
      details: `$${Number(payment.amount).toLocaleString()} via ${payment.payment_method?.replace(/_/g, " ") || "Unknown"}`,
      date: payment.payment_date,
    });
  });

  // Add customer creation as note
  activities.push({
    id: "customer-created",
    type: "note",
    action: "Customer Created",
    details: `Customer account created in the system`,
    date: customer.created_at,
  });

  // Sort by date descending
  return activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

// Calculate financial summary
export function calculateSummary(
  sales: any[],
  payments: any[],
): { totalPurchases: number; totalPaid: number; balance: number } {
  const totalPurchases = sales.reduce(
    (sum, sale) => sum + Number(sale.total),
    0,
  );
  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const balance = totalPurchases - totalPaid;

  return {
    totalPurchases,
    totalPaid,
    balance,
  };
}
