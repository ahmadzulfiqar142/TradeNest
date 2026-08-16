"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adjustInventory } from "@/actions/inventory";
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentValues,
} from "@/schemas/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type ProductOption = {
  id: string;
  name: string;
  unit: string;
};

export function InventoryAdjustmentForm({
  workspaceId,
  products,
}: {
  workspaceId: string;
  products: ProductOption[];
}) {
  const { success, error } = useToast();
  const [selectedProductId, setSelectedProductId] = useState("");

  const form = useForm<InventoryAdjustmentValues>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      productId: "",
      direction: "increase",
      quantity: 1,
      reason: "",
    },
  });

  async function submit(values: InventoryAdjustmentValues) {
    const result = await adjustInventory(workspaceId, values);
    if (result.success) {
      success(result.message);
      form.reset({
        productId: "",
        direction: "increase",
        quantity: 1,
        reason: "",
      });
      setSelectedProductId("");
    } else {
      error(result.message);
    }
  }

  const productOptions = products.map((product) => ({
    id: product.id,
    label: `${product.name} (${product.unit})`,
  }));

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2"
    >
      <div className="space-y-1">
        <span className="text-sm font-medium">Product</span>
        <Autocomplete
          options={productOptions}
          value={selectedProductId}
          onValueChange={(value) => {
            const safeValue = value ?? "";
            form.setValue("productId", safeValue);
            setSelectedProductId(safeValue);
          }}
          placeholder="Select product"
          required
          error={form.formState.errors.productId?.message}
        />
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Adjustment type</span>
        <select
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          {...form.register("direction")}
        >
          <option value="increase">Increase</option>
          <option value="decrease">Decrease</option>
        </select>
      </div>

      <label className="space-y-1">
        <span className="text-sm font-medium">Quantity</span>
        <Input
          type="number"
          min="0.001"
          step="0.001"
          {...form.register("quantity", { valueAsNumber: true })}
        />
        <span className="text-sm text-destructive">
          {form.formState.errors.quantity?.message}
        </span>
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium">Reason</span>
        <Input
          placeholder="e.g. Physical count correction"
          {...form.register("reason")}
        />
        <span className="text-sm text-destructive">
          {form.formState.errors.reason?.message}
        </span>
      </label>

      <div className="md:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save adjustment"}
        </Button>
      </div>
    </form>
  );
}
