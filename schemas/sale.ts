import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be 0 or more"),
  discount: z.number().min(0).max(100),
  total: z.number().min(0),
  unit: z.string().nullable().optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  saleDate: z.string().min(1, "Sale date is required"),
  discount: z.number().min(0),
  notes: z.string().trim().optional().nullable(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  // Optional initial payment
  paidAmount: z.number().min(0),
  paymentMethod: z.string().optional().nullable(),
});

export type SaleItemFormValues = z.infer<typeof saleItemSchema>;
export type CreateSaleFormValues = z.infer<typeof createSaleSchema>;

export const SALE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const SALE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  partially_paid: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};
