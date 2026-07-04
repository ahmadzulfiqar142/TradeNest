import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const createCustomerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[0-9]+$/, "Phone number must contain only numbers"),
  address: optionalText,
  city: optionalText,
  notes: optionalText.refine((val) => !val || val.length <= 500, {
    message: "Notes must not exceed 500 characters",
  }),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;
