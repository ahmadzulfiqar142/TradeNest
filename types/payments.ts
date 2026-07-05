export type SaleStatus = "pending" | "partially_paid" | "paid" | "cancelled";

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface PaymentWithCustomer {
  id: string;
  workspace_id: string;
  customer_id: string;
  sale_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customers: Customer;
}

export interface PaymentsClientProps {
  payments: PaymentWithCustomer[];
  workspaceId: string;
  customers: Customer[];
  searchParams: {
    customerId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}
