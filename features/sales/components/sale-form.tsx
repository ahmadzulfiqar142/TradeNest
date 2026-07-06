"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { createSale } from "@/actions/sale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PAYMENT_METHODS } from "@/schemas/payment";
import { createSaleSchema, type CreateSaleFormValues } from "@/schemas/sale";
import { useToast } from "@/hooks/use-toast";

type Product = { id: string; name: string; selling_price: number; stock_quantity: number; sku: string | null };
type Customer = { id: string; first_name: string; last_name: string; phone: string };
type SaleFormProps = { workspaceId: string; products: Product[]; customers: Customer[] };

const selectClass = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted";

export function SaleForm({ workspaceId, products, customers }: SaleFormProps) {
  const router = useRouter();
  const { success, error } = useToast();

  const form = useForm<CreateSaleFormValues>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      customerId: null,
      saleDate: new Date().toISOString().split("T")[0],
      discount: 0,
      notes: null,
      items: [{ productId: "", productName: "", quantity: 1, unitPrice: 0, discount: 0, total: 0, unit: null }],
      paidAmount: 0,
      paymentMethod: null,
    },
  });

  const items = form.watch("items");
  const discount = form.watch("discount");
  const paidAmount = form.watch("paidAmount");
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - discount);

  const updateItem = (index: number, field: keyof CreateSaleFormValues["items"][0], value: string | number) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === "productId") {
      const p = products.find((p) => p.id === value);
      if (p) { item.productName = p.name; item.unitPrice = p.selling_price; }
    }
    item.total = Math.max(0, item.unitPrice * item.quantity * (1 - item.discount / 100));
    updated[index] = item;
    form.setValue("items", updated);
  };

  const addItem = () => form.setValue("items", [...items, { productId: "", productName: "", quantity: 1, unitPrice: 0, discount: 0, total: 0, unit: null }]);
  const removeItem = (index: number) => form.setValue("items", items.filter((_, i) => i !== index));

  const onSubmit = async (data: CreateSaleFormValues) => {
    const result = await createSale(workspaceId, data);
    if (result.success) {
      success(result.message);
      if (result.saleId) router.push(`/sales/${result.saleId}`);
    } else {
      error(result.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <FormControl>
                      <Autocomplete
                        options={customers.map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}`, subtitle: c.phone }))}
                        value={field.value}
                        onValueChange={(v) => form.setValue("customerId", v ?? null)}
                        placeholder="Walk-in / Search customer..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional notes..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Items</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />Add Item
              </Button>
            </div>

            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Disc %</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1" />
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 md:col-span-4">
                    <Autocomplete
                      options={products.map((p) => ({ id: p.id, label: p.name, subtitle: `Rs. ${Number(p.selling_price).toLocaleString()} · Stock: ${p.stock_quantity}` }))}
                      value={item.productId || null}
                      onValueChange={(v) => updateItem(index, "productId", v ?? "")}
                      placeholder="Select product..."
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} className="text-center" placeholder="Qty" />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} className="text-center" placeholder="Price" />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Input type="number" min={0} max={100} value={item.discount} onChange={(e) => updateItem(index, "discount", Number(e.target.value))} className="text-center" placeholder="0" />
                  </div>
                  <div className="col-span-4 md:col-span-1 text-right font-medium text-sm">
                    Rs. {Number(item.total).toLocaleString()}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t flex flex-col items-end gap-2 text-sm">
              <div className="flex gap-8 text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground w-32 text-right">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex gap-8 items-center">
                <span className="text-muted-foreground">Discount (Rs.)</span>
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <Input type="number" min={0} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} className="w-32 text-right" />
                  )}
                />
              </div>
              <div className="flex gap-8 text-base font-bold">
                <span>Total</span>
                <span className="w-32 text-right">Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Payment <span className="text-muted-foreground text-xs font-normal">(optional — leave 0 for credit sale)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    {paidAmount > 0 && paidAmount < total && <p className="text-xs text-blue-500">Outstanding: Rs. {(total - paidAmount).toLocaleString()}</p>}
                    {paidAmount >= total && total > 0 && <p className="text-xs text-green-500">Fully paid ✓</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method {paidAmount > 0 && <span className="text-destructive">*</span>}</FormLabel>
                    <FormControl>
                      <select {...field} value={field.value ?? ""} className={selectClass} required={paidAmount > 0}>
                        <option value="">Select method...</option>
                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting || items.every((i) => !i.productId)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            {form.formState.isSubmitting ? "Creating..." : "Create Sale"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
