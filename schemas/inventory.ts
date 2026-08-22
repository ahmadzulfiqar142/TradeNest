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

