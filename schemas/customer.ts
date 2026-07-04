import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const money = z.coerce
  .number({ error: "Enter a valid amount" })
  .min(0, "Amount cannot be negative");

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Customer name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: optionalText,
  whatsapp: optionalText,
  address: optionalText,
  city: optionalText,
  state: optionalText,
  country: optionalText,
  idNumber: optionalText,
  creditLimit: money,
  openingBalance: money,
  notes: optionalText,
  isActive: z.boolean().default(true),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;
