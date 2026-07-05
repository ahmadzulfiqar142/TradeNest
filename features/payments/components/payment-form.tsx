"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import {
  createPayment,
  updatePayment,
  type PaymentActionState,
} from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  createPaymentSchema,
} from "@/schemas/payment";
import type { CreatePaymentFormValues } from "@/schemas/payment";

type PaymentFormProps = {
  workspaceId: string;
  mode?: "create" | "edit";
  payment?: {
    id: string;
    customer_id: string;
    invoice_id: string | null;
    product_id: string | null;
    quantity: number | null;
    amount: number;
    payment_method: string;
    payment_date: string;
    payment_status: "pending" | "paid";
    reference_number: string | null;
    notes: string | null;
  };
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  }[];
  products: {
    id: string;
    name: string;
    selling_price: number;
    stock_quantity: number;
    unit: string | null;
  }[];
  onSuccess?: () => void;
};

const initialState: PaymentActionState = { message: "", success: false };

const inputClass = (hasError?: boolean) =>
  `px-4 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
    hasError ? "border-red-500" : "border-border"
  }`;

export function PaymentForm({
  workspaceId,
  mode = "create",
  payment,
  customers,
  products,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();

  const paymentAction =
    mode === "edit" && payment
      ? updatePayment.bind(null, workspaceId, payment.id)
      : createPayment.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(
    paymentAction,
    initialState,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      customerId: payment?.customer_id ?? "",
      amount: payment?.amount ?? 0,
      paymentMethod: payment?.payment_method ?? "",
      paymentDate:
        payment?.payment_date ?? new Date().toISOString().split("T")[0],
      paymentStatus: payment?.payment_status ?? "pending",
      productId: payment?.product_id ?? undefined,
      quantity: 1, // This will be updated by useEffect when product is loaded
    },
  });

  // Update quantity when editing a payment with a product
  useEffect(() => {
    if (mode === "edit" && payment?.product_id && payment?.quantity) {
      setValue("productId", payment.product_id);
      setValue("quantity", payment.quantity);
      // Recalculate amount based on product price and quantity
      const product = products.find((p) => p.id === payment.product_id);
      if (product) {
        setValue("amount", product.selling_price * payment.quantity);
      }
    }
  }, [mode, payment, products, setValue]);

  const selectedProductId = watch("productId");
  const quantity = watch("quantity") ?? 1;
  const paymentStatus = watch("paymentStatus");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

  useEffect(() => {
    if (selectedProduct && quantity > 0) {
      setValue("amount", selectedProduct.selling_price * quantity);
    }
  }, [selectedProduct, quantity, setValue]);

  const totalAmount = useMemo(() => {
    if (selectedProduct && quantity > 0) {
      return selectedProduct.selling_price * quantity;
    }
    return watch("amount") || 0;
  }, [selectedProduct, quantity, watch]);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      if (mode === "create") router.refresh();
    }
  }, [state.success, onSuccess, mode, router]);

  const onSubmit = (data: CreatePaymentFormValues) => {
    const formData = new FormData();
    formData.append("customerId", data.customerId);
    formData.append("amount", data.amount.toString());
    formData.append("paymentMethod", data.paymentMethod);
    formData.append("paymentDate", data.paymentDate);
    formData.append("paymentStatus", data.paymentStatus);
    if (data.productId) formData.append("productId", data.productId);
    if (data.quantity) formData.append("quantity", data.quantity.toString());
    formAction(formData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer */}
            <Autocomplete
              options={customers.map((c) => ({
                id: c.id,
                label: `${c.first_name} ${c.last_name}`,
                subtitle: c.phone,
              }))}
              value={watch("customerId")}
              onValueChange={(v) => setValue("customerId", v ?? "")}
              placeholder="Search customers..."
              label="Customer"
              required
              error={errors.customerId?.message}
            />

            {/* Product */}
            <Autocomplete
              options={products.map((p) => ({
                id: p.id,
                label: p.name,
                subtitle:
                  `Rs. ${Number(p.selling_price).toLocaleString()} · Stock: ${p.stock_quantity} ${p.unit ?? ""}`.trim(),
              }))}
              value={watch("productId") ?? null}
              onValueChange={(v) => {
                setValue("productId", v ?? "");
                setValue("quantity", 1);
              }}
              placeholder="Search products..."
              label="Product"
              required
              error={errors.productId?.message}
            />

            {/* Amount */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="amount"
                className="text-sm font-medium text-foreground"
              >
                Amount <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="amount"
                {...register("amount", { valueAsNumber: true })}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={inputClass(!!errors.amount)}
              />
              {selectedProduct && quantity > 0 && (
                <div className="p-3 bg-muted rounded-md space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {quantity} × Rs.{" "}
                    {Number(selectedProduct.selling_price).toLocaleString()} =
                    Rs.{" "}
                    <span className="font-semibold text-foreground">
                      {(
                        selectedProduct.selling_price * quantity
                      ).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-xs font-medium text-primary">
                    Total Amount: Rs. {totalAmount.toLocaleString()}
                  </p>
                </div>
              )}
              {errors.amount && (
                <p className="text-xs text-red-400">{errors.amount.message}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="quantity"
                className="text-sm font-medium text-foreground"
              >
                Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                {...register("quantity", { valueAsNumber: true })}
                min="1"
                max={selectedProduct?.stock_quantity ?? 9999}
                className={inputClass(!!errors.quantity)}
              />
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Available: {selectedProduct.stock_quantity}{" "}
                  {selectedProduct.unit}
                </p>
              )}
              {errors.quantity && (
                <p className="text-xs text-red-400">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="paymentDate"
                className="text-sm font-medium text-foreground"
              >
                Payment Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="paymentDate"
                {...register("paymentDate")}
                className={inputClass(!!errors.paymentDate)}
              />
              {errors.paymentDate && (
                <p className="text-xs text-red-400">
                  {errors.paymentDate.message}
                </p>
              )}
            </div>

            {/* Payment Status */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="paymentStatus"
                className="text-sm font-medium text-foreground"
              >
                Payment Status <span className="text-red-400">*</span>
              </label>
              <select
                id="paymentStatus"
                {...register("paymentStatus")}
                className={inputClass(!!errors.paymentStatus)}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {errors.paymentStatus && (
                <p className="text-xs text-red-400">
                  {errors.paymentStatus.message}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="paymentMethod"
                className="text-sm font-medium text-foreground"
              >
                Payment Method <span className="text-red-400">*</span>
              </label>
              <select
                id="paymentMethod"
                {...register("paymentMethod")}
                className={inputClass(!!errors.paymentMethod)}
              >
                <option value="">Select payment method</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && (
                <p className="text-xs text-red-400">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={pending} className="px-6 py-2">
              {mode === "edit" ? (
                <>
                  <Save className="h-4 w-4" />
                  {pending ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {pending ? "Creating..." : "Add Payment"}
                </>
              )}
            </Button>
          </div>

          {state.message && (
            <p
              className={
                state.success
                  ? "text-sm font-medium text-green-400"
                  : "text-sm font-medium text-red-400"
              }
              aria-live="polite"
            >
              {state.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
