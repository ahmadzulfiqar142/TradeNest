import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
