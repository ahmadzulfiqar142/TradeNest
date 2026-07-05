import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const createPaymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceId: z.string().optional().nullable(),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(999999999.99, "Amount is too large"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentStatus: z.enum(["pending", "paid"]),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  productId: z.string().min(1, "Product is required"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(9999, "Quantity is too large"),
});

export const updatePaymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(999999999.99, "Amount is too large"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentStatus: z.enum(["pending", "paid"]),
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1).max(9999),
});

export type CreatePaymentFormValues = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentFormValues = z.infer<typeof updatePaymentSchema>;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
export type PaymentStatus = "pending" | "paid";

export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
] as const;
