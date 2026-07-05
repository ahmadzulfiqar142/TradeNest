"use client";

import { useActionState, useEffect } from "react";
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
import { PAYMENT_METHODS, createPaymentSchema } from "@/schemas/payment";
import type { CreatePaymentFormValues } from "@/schemas/payment";

type OpenSale = { id: string; invoice_number: string; total: number; status: string };

type PaymentFormProps = {
  workspaceId: string;
  mode?: "create" | "edit";
  payment?: {
    id: string;
    customer_id: string;
    sale_id: string | null;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number: string | null;
    notes: string | null;
  };
  customers: { id: string; first_name: string; last_name: string; phone: string }[];
  openSales?: OpenSale[];
  preselectedSaleId?: string | null;
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
  openSales = [],
  preselectedSaleId,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();

  const paymentAction =
    mode === "edit" && payment
      ? updatePayment.bind(null, workspaceId, payment.id)
      : createPayment.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(paymentAction, initialState);

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
      saleId: payment?.sale_id ?? preselectedSaleId ?? null,
      amount: payment?.amount ?? 0,
      paymentMethod: payment?.payment_method ?? "",
      paymentDate: payment?.payment_date ?? new Date().toISOString().split("T")[0],
      referenceNumber: payment?.reference_number ?? null,
      notes: payment?.notes ?? null,
    },
  });

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
    if (data.saleId) formData.append("saleId", data.saleId);
    if (data.referenceNumber) formData.append("referenceNumber", data.referenceNumber);
    if (data.notes) formData.append("notes", data.notes);
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

            {/* Link to Sale (optional) */}
            {openSales.length > 0 && (
              <div className="flex flex-col gap-2">
                <label htmlFor="saleId" className="text-sm font-medium text-foreground">
                  Link to Invoice <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <select
                  id="saleId"
                  {...register("saleId")}
                  className={inputClass()}
                >
                  <option value="">Advance / Unlinked Payment</option>
                  {openSales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.invoice_number} — Rs. {Number(s.total).toLocaleString()} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount */}
            <div className="flex flex-col gap-2">
              <label htmlFor="amount" className="text-sm font-medium text-foreground">
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
              {errors.amount && (
                <p className="text-xs text-red-400">{errors.amount.message}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-2">
              <label htmlFor="paymentMethod" className="text-sm font-medium text-foreground">
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
                <p className="text-xs text-red-400">{errors.paymentMethod.message}</p>
              )}
            </div>

            {/* Payment Date */}
            <div className="flex flex-col gap-2">
              <label htmlFor="paymentDate" className="text-sm font-medium text-foreground">
                Payment Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="paymentDate"
                {...register("paymentDate")}
                className={inputClass(!!errors.paymentDate)}
              />
              {errors.paymentDate && (
                <p className="text-xs text-red-400">{errors.paymentDate.message}</p>
              )}
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-2">
              <label htmlFor="referenceNumber" className="text-sm font-medium text-foreground">
                Reference Number <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                type="text"
                id="referenceNumber"
                {...register("referenceNumber")}
                placeholder="e.g. TXN-12345"
                className={inputClass()}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium text-foreground">
                Notes <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                type="text"
                id="notes"
                {...register("notes")}
                placeholder="Any additional notes..."
                className={inputClass()}
              />
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
