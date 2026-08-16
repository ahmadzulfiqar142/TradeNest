import { z } from "zod";

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid("Select a product"),
  direction: z.enum(["increase", "decrease"]),
  quantity: z
    .number({ error: "Enter a quantity" })
    .positive("Quantity must be greater than zero"),
  reason: z.string().trim().min(1, "An adjustment reason is required").max(500),
});

export type InventoryAdjustmentValues = z.infer<
  typeof inventoryAdjustmentSchema
>;

export const stockInBatchSchema = z.object({
  productId: z.string().uuid("Select a product"),
  productUnitId: z.string().uuid("Select a unit"),
  quantity: z
    .number({ error: "Enter a quantity" })
    .positive("Quantity must be greater than zero"),
  batchNumber: z.string().trim().optional(),
  expiryDate: z.string().optional(),
  purchasePrice: z
    .number({ error: "Enter a price" })
    .min(0, "Price cannot be negative"),
});

export type StockInBatchValues = z.infer<typeof stockInBatchSchema>;
