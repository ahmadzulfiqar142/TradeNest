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
  invoice_id: string | null;
  product_id: string | null;
  quantity: number | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  payment_status: string;
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
  products: {
    id: string;
    name: string;
    selling_price: number;
    stock_quantity: number;
    unit: string | null;
  }[];
  searchParams: {
    customerId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}
