"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number({ error: "Enter a valid price" }).min(0),
  cost: z.number({ error: "Enter a valid cost" }).min(0),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "discontinued"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

const inputClass =
  "px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all";

interface ProductFormProps {
  onSubmit?: () => void;
}

export function ProductForm({ onSubmit: onSuccess }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { status: "active", price: 0, cost: 0 },
  });

  const onSubmit = async (data: ProductFormValues) => {
    console.log("Product Form Submitted:", data);
    reset();
    onSuccess?.();
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
      <h2 className="text-2xl font-semibold text-gray-100 mb-6">Create New Product</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">Product Name *</label>
            <input id="name" type="text" {...register("name")} placeholder="Enter product name" className={inputClass} disabled={isSubmitting} />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sku" className="text-sm font-medium text-gray-300">SKU *</label>
            <input id="sku" type="text" {...register("sku")} placeholder="e.g., PROD-001" className={inputClass} disabled={isSubmitting} />
            {errors.sku && <p className="text-xs text-red-400">{errors.sku.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-300">Category *</label>
            <select id="category" {...register("category")} className={inputClass} disabled={isSubmitting}>
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="software">Software</option>
              <option value="services">Services</option>
              <option value="physical">Physical Products</option>
            </select>
            {errors.category && <p className="text-xs text-red-400">{errors.category.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="price" className="text-sm font-medium text-gray-300">Price ($) *</label>
            <input id="price" type="number" {...register("price", { valueAsNumber: true })} placeholder="0.00" step="0.01" min="0" className={inputClass} disabled={isSubmitting} />
            {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="cost" className="text-sm font-medium text-gray-300">Cost ($) *</label>
            <input id="cost" type="number" {...register("cost", { valueAsNumber: true })} placeholder="0.00" step="0.01" min="0" className={inputClass} disabled={isSubmitting} />
            {errors.cost && <p className="text-xs text-red-400">{errors.cost.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="status" className="text-sm font-medium text-gray-300">Status</label>
            <select id="status" {...register("status")} className={inputClass} disabled={isSubmitting}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-300">Description</label>
          <textarea id="description" {...register("description")} placeholder="Enter product description" rows={4} className={`${inputClass} resize-none`} disabled={isSubmitting} />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => reset()} className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors font-medium" disabled={isSubmitting}>
            Reset
          </button>
          <Button type="submit" className="px-6 py-2" disabled={isSubmitting}>
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
