"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockInBatch } from "@/actions/inventory";
import {
  stockInBatchSchema,
  type StockInBatchValues,
} from "@/schemas/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type ProductOption = {
  id: string;
  name: string;
  units: { id: string; symbol: string; conversionFactor: number }[];
};

export function StockInForm({
  workspaceId,
  products,
}: {
  workspaceId: string;
  products: ProductOption[];
}) {
  const { success, error } = useToast();
  const [selectedProductId, setSelectedProductId] = useState("");

  const form = useForm<StockInBatchValues>({
    resolver: zodResolver(stockInBatchSchema),
    defaultValues: {
      productId: "",
      productUnitId: "",
      quantity: 1,
      batchNumber: "",
      expiryDate: "",
      purchasePrice: 0,
    },
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  async function onSubmit(values: StockInBatchValues) {
    const result = await stockInBatch(workspaceId, values);
    if (result.success) {
      success(result.message);
      form.reset({
        productId: "",
        productUnitId: "",
        quantity: 1,
        batchNumber: "",
        expiryDate: "",
        purchasePrice: 0,
      });
      setSelectedProductId("");
    } else {
      error(result.message);
    }
  }

  const productOptions = products.map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const unitOptions =
    selectedProduct?.units.map((u) => ({
      id: u.id,
      label: `${u.symbol} (×${u.conversionFactor})`,
    })) || [];

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2"
    >
      <div className="space-y-1">
        <span className="text-sm font-medium">Product *</span>
        <Autocomplete
          options={productOptions}
          value={selectedProductId}
          onValueChange={(value) => {
            const safeValue = value ?? "";
            form.setValue("productId", safeValue);
            form.setValue("productUnitId", "");
            setSelectedProductId(safeValue);
          }}
          placeholder="Select product"
          required
          error={form.formState.errors.productId?.message}
        />
      </div>
      <div className="space-y-1">
        <span className="text-sm font-medium">Unit *</span>
        <Autocomplete
          options={unitOptions}
          value={form.watch("productUnitId")}
          onValueChange={(value) => {
            form.setValue("productUnitId", value ?? "");
          }}
          placeholder="Select unit"
          disabled={!selectedProduct}
          required
          error={form.formState.errors.productUnitId?.message}
        />
      </div>

      <label className="space-y-1">
        <span className="text-sm font-medium">Quantity *</span>
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
        <span className="text-sm font-medium">Purchase price</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          {...form.register("purchasePrice", { valueAsNumber: true })}
        />
        <span className="text-sm text-destructive">
          {form.formState.errors.purchasePrice?.message}
        </span>
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium">Batch number</span>
        <Input placeholder="e.g. BATCH-001" {...form.register("batchNumber")} />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium">Expiry date</span>
        <Input type="date" {...form.register("expiryDate")} />
      </label>

      <div className="md:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Receive stock"}
        </Button>
      </div>
    </form>
  );
}
