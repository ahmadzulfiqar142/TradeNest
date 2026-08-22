import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();
const money = z.number({ error: "Enter a valid amount" }).min(0, "Amount cannot be negative");

export const productUnitSchema = z.object({
  unitId: z.string().uuid("Select a unit"),
  conversionFactor: z.number({ error: "Enter a conversion factor" }).positive("Conversion factor must be greater than 0"),
  isDefault: z.boolean(),
  sellingPrice: money,
  purchasePrice: money,
  bagWeight: z.number().positive().nullable().optional(),
  bagWeightUnit: z.string().nullable().optional(),
});

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2, "Product name must be at least 2 characters"),
    sku: optionalText,
    barcode: optionalText,
    description: optionalText,
    imageUrl: z.string().trim().url("Enter a valid image URL").optional().nullable().or(z.literal("").transform(() => undefined)),
    categoryId: optionalText,
    newCategoryName: optionalText,
    units: z.array(productUnitSchema).min(1, "Add at least one unit"),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    let defaultCount = 0;
    value.units.forEach((unit, index) => {
      if (seen.has(unit.unitId)) context.addIssue({ code: "custom", message: "A unit can only be added once", path: ["units", index, "unitId"] });
      seen.add(unit.unitId);
      if (unit.isDefault) {
        defaultCount += 1;
        if (unit.conversionFactor !== 1) context.addIssue({ code: "custom", message: "The default (base) unit must have a conversion factor of 1", path: ["units", index, "conversionFactor"] });
      }
    });
    if (defaultCount !== 1) context.addIssue({ code: "custom", message: "Select exactly one default unit", path: ["units"] });
  });

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
