import { z } from "zod";

export const LineItemType = {
  Product: "product",
  OneTime: "one_time",
} as const;

export type LineItemTypeValue =
  (typeof LineItemType)[keyof typeof LineItemType];

const baseItemFields = {
  quantity: z
    .number("Quantity is required")
    .int()
    .min(1, "Quantity must be at least 1"),
  unitPrice: z.number("Price is required").min(0, "Price must be 0 or more"),
  discount: z.number().min(0).max(100),
  total: z.number().min(0),
};

export const productLineItemSchema = z.object({
  type: z.literal(LineItemType.Product),
  productId: z.string("Select a product"),
  productName: z.string(),
  ...baseItemFields,
});

export const oneTimeLineItemSchema = z.object({
  type: z.literal(LineItemType.OneTime),
  productId: z.null().optional(),
  productName: z
    .string("Item name is required")
    .min(1, "Item name is required")
    .max(100, "Item must be less than 100 characters"),
  ...baseItemFields,
});

export const saleItemSchema = z.discriminatedUnion("type", [
  productLineItemSchema,
  oneTimeLineItemSchema,
]);

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  saleDate: z.string().min(1, "Sale date is required"),
  discount: z.number().min(0),
  notes: z.string().trim().optional().nullable(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  paidAmount: z.number().min(0),
  paymentMethod: z.string().optional().nullable(),
});

export type ProductLineItem = z.infer<typeof productLineItemSchema>;
export type OneTimeLineItem = z.infer<typeof oneTimeLineItemSchema>;
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
