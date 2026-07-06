"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { createSale, type SaleActionState } from "@/actions/sale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS } from "@/schemas/payment";
import { createSaleSchema, type CreateSaleFormValues } from "@/schemas/sale";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: string;
  name: string;
  selling_price: number;
  stock_quantity: number;
  sku: string | null;
};

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
};

type SaleFormProps = {
  workspaceId: string;
  products: Product[];
  customers: Customer[];
};

const initialState: SaleActionState = { message: "", success: false };

const inputClass =
  "px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm";

export function SaleForm({ workspaceId, products, customers }: SaleFormProps) {
  const router = useRouter();
  const action = createSale.bind(null, workspaceId);
  const [state, formAction] = useActionState(action, initialState);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();
  const handledStateRef = useRef(state);

  useEffect(() => {
    if (state === handledStateRef.current) return;
    handledStateRef.current = state;
    if (!state.message) return;
    if (state.success) {
      success(state.message);
      if (state.saleId) router.push(`/sales/${state.saleId}`);
    } else {
      error(state.message);
    }
  }, [state, success, error, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSaleFormValues>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      customerId: null,
      saleDate: new Date().toISOString().split("T")[0],
      discount: 0,
      notes: null,
      items: [
        {
          productId: "",
          productName: "",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          total: 0,
          unit: null,
        },
      ],
      paidAmount: 0,
      paymentMethod: null,
    },
  });

  const items = watch("items");
  const discount = watch("discount");
  const paidAmount = watch("paidAmount");

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - discount);

  const updateItem = (
    index: number,
    field: keyof CreateSaleFormValues["items"][0],
    value: string | number,
  ) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index], [field]: value };

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        item.productName = product.name;
        item.unitPrice = product.selling_price;
      }
    }

    item.total = Math.max(
      0,
      item.unitPrice * item.quantity * (1 - item.discount / 100),
    );
    updatedItems[index] = item;
    setValue("items", updatedItems);
  };

  const addItem = () => {
    const newItems = [
      ...items,
      {
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0,
        unit: null,
      },
    ];
    setValue("items", newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setValue("items", newItems);
  };

  const onSubmit = (data: CreateSaleFormValues) => {
    const formData = new FormData();
    formData.append(
      "payload",
      JSON.stringify({
        customerId: data.customerId,
        saleDate: data.saleDate,
        discount: data.discount,
        notes: data.notes,
        items: data.items,
        paidAmount: data.paidAmount,
        paymentMethod: data.paymentMethod,
      }),
    );
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Customer{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </label>
              <Autocomplete
                options={customers.map((c) => ({
                  id: c.id,
                  label: `${c.first_name} ${c.last_name}`,
                  subtitle: c.phone,
                }))}
                value={watch("customerId")}
                onValueChange={(v) => setValue("customerId", v ?? null)}
                placeholder="Walk-in / Search customer..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Sale Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                {...register("saleDate")}
                className={inputClass}
                required
              />
              {errors.saleDate && (
                <p className="text-xs text-red-400">
                  {errors.saleDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Notes
              </label>
              <input
                type="text"
                {...register("notes")}
                placeholder="Optional notes..."
                className={inputClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Items</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {/* Header row */}
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
                    options={products.map((p) => ({
                      id: p.id,
                      label: p.name,
                      subtitle: `Rs. ${Number(p.selling_price).toLocaleString()} · Stock: ${p.stock_quantity}`,
                    }))}
                    value={item.productId || null}
                    onValueChange={(v) =>
                      updateItem(index, "productId", v ?? "")
                    }
                    placeholder="Select product..."
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    min={1}
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                    className={`${inputClass} text-center w-full`}
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                    className={`${inputClass} text-center w-full`}
                    placeholder="Price"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register(`items.${index}.discount`, {
                      valueAsNumber: true,
                    })}
                    className={`${inputClass} text-center w-full`}
                    placeholder="0"
                  />
                </div>
                <div className="col-span-4 md:col-span-1 text-right font-medium text-sm">
                  Rs. {Number(item.total).toLocaleString()}
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t flex flex-col items-end gap-2 text-sm">
            <div className="flex gap-8 text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground w-32 text-right">
                Rs. {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-8 items-center">
              <span className="text-muted-foreground">Discount (Rs.)</span>
              <input
                type="number"
                min={0}
                {...register("discount", { valueAsNumber: true })}
                className={`${inputClass} w-32 text-right`}
              />
            </div>
            <div className="flex gap-8 text-base font-bold">
              <span>Total</span>
              <span className="w-32 text-right">
                Rs. {total.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Payment{" "}
            <span className="text-muted-foreground text-xs font-normal">
              (optional — leave 0 for credit sale)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Amount Paid
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                {...register("paidAmount", { valueAsNumber: true })}
                className={inputClass}
                placeholder="0.00"
              />
              {paidAmount > 0 && paidAmount < total && (
                <p className="text-xs text-blue-500">
                  Outstanding: Rs. {(total - paidAmount).toLocaleString()}
                </p>
              )}
              {paidAmount >= total && total > 0 && (
                <p className="text-xs text-green-500">Fully paid ✓</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Payment Method{" "}
                {paidAmount > 0 && <span className="text-red-400">*</span>}
              </label>
              <select
                {...register("paymentMethod")}
                className={inputClass}
                required={paidAmount > 0}
              >
                <option value="">Select method...</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || items.every((i) => !i.productId)}
        >
          <ShoppingCart className="h-4 w-4" />
          {pending ? "Creating..." : "Create Sale"}
        </Button>
      </div>
    </form>
  );
}
