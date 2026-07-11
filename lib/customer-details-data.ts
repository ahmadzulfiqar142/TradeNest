// v2 Customer Detail types — clean architecture, no Payment-product coupling

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

export interface CustomerFinancialSummary {
  totalSales: number;
  totalPayments: number;
  outstandingBalance: number; // max(0, totalSales - totalPayments)
  advanceBalance: number; // sum of unlinked payments (sale_id IS NULL)
  totalInvoices: number;
  totalPaymentsReceived: number;
  lastSaleDate: string | null;
  lastPaymentDate: string | null;
}

export interface InvoiceHistory {
  id: string;
  invoiceNumber: string;
  saleDate: string;
  items: { productName: string; quantity: number }[];
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "partially_paid" | "paid" | "cancelled";
}

export interface PaymentHistory {
  id: string;
  receiptNumber: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  saleId: string | null;
  invoiceNumber: string | null; // resolved from sale
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: "SALE" | "PAYMENT" | "ADVANCE" | "REFUND" | "ADJUSTMENT";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
