"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adjustInventory } from "@/actions/inventory";
import { inventoryAdjustmentSchema, type InventoryAdjustmentValues } from "@/schemas/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function InventoryAdjustmentForm({ workspaceId, products }: { workspaceId: string; products: { id: string; name: string; unit: string }[] }) {
  const { success, error } = useToast();
  const form = useForm<InventoryAdjustmentValues>({ resolver: zodResolver(inventoryAdjustmentSchema), defaultValues: { productId: "", direction: "increase", quantity: 1, reason: "" } });
  async function submit(values: InventoryAdjustmentValues) {
    const result = await adjustInventory(workspaceId, values);
    if (result.success) { success(result.message); form.reset({ productId: "", direction: "increase", quantity: 1, reason: "" }); }
    else error(result.message);
  }
  return <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2">
    <label className="space-y-1"><span className="text-sm font-medium">Product</span><select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...form.register("productId")}><option value="">Select product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} ({product.unit})</option>)}</select><span className="text-sm text-destructive">{form.formState.errors.productId?.message}</span></label>
    <label className="space-y-1"><span className="text-sm font-medium">Adjustment type</span><select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...form.register("direction")}><option value="increase">Increase</option><option value="decrease">Decrease</option></select></label>
    <label className="space-y-1"><span className="text-sm font-medium">Quantity</span><Input type="number" min="0.001" step="0.001" {...form.register("quantity", { valueAsNumber: true })} /><span className="text-sm text-destructive">{form.formState.errors.quantity?.message}</span></label>
    <label className="space-y-1"><span className="text-sm font-medium">Reason</span><Input placeholder="e.g. Physical count correction" {...form.register("reason")} /><span className="text-sm text-destructive">{form.formState.errors.reason?.message}</span></label>
    <div className="md:col-span-2"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : "Save adjustment"}</Button></div>
  </form>;
}
