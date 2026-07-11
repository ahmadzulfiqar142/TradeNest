import { z } from "zod";

export const createPaymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  saleId: z.string().nullable().optional(),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(999999999.99, "Amount is too large"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  referenceNumber: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updatePaymentSchema = createPaymentSchema;

export type CreatePaymentFormValues = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentFormValues = z.infer<typeof updatePaymentSchema>;

export const PAYMENT_METHODS = [
  { value: "advance", label: "Advance Balance" },
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
