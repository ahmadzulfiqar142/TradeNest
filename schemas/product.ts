import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();

const optionalDate = z.string().trim().optional().nullable();

const money = z
  .number({ error: "Enter a valid amount" })
  .min(0, "Amount cannot be negative");

const quantity = z
  .number({ error: "Enter a valid quantity" })
  .int("Quantity must be a whole number")
  .min(0, "Quantity cannot be negative");

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters"),
  sku: optionalText,
  barcode: optionalText,
  description: optionalText,
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => undefined)),
  categoryId: optionalText,
  newCategoryName: optionalText,
  purchasePrice: money,
  sellingPrice: money,
  stockQuantity: quantity,
  expiryDate: optionalDate,
  isActive: z.boolean(),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
