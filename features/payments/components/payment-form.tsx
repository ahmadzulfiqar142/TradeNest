"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Save, Wallet } from "lucide-react";
import {
  createPayment,
  updatePayment,
  getOpenSalesForCustomer,
} from "@/actions/payment";
import { getCustomerAdvanceBalance } from "@/actions/sale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  PAYMENT_METHODS,
  createPaymentSchema,
  type CreatePaymentFormValues,
} from "@/schemas/payment";
import { useToast } from "@/hooks/use-toast";

type OpenSale = {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  remaining_amount?: number;
};

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
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  }[];
  openSales?: OpenSale[];
  preselectedSaleId?: string | null;
  onSuccess?: () => void;
};

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted";

// Payment methods excluding "advance" — advance is only shown when a sale is selected
const REGULAR_PAYMENT_METHODS = PAYMENT_METHODS.filter(
  (m) => m.value !== "advance",
);

export function PaymentForm({
  workspaceId,
  mode = "create",
  payment,
  customers,
  openSales: initialOpenSales = [],
  preselectedSaleId,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [openSales, setOpenSales] = useState<OpenSale[]>(initialOpenSales);
  const [loadingSales, setLoadingSales] = useState(false);
  const [advanceBalance, setAdvanceBalance] = useState(0);

  const form = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      customerId: payment?.customer_id ?? "",
      saleId: payment?.sale_id ?? preselectedSaleId ?? null,
      amount: payment?.amount ?? 0,
      paymentMethod: payment?.payment_method ?? "",
      paymentDate:
        payment?.payment_date ?? new Date().toISOString().split("T")[0],
      referenceNumber: payment?.reference_number ?? null,
      notes: payment?.notes ?? null,
    },
  });

  const customerId = form.watch("customerId");
  const saleId = form.watch("saleId");

  // Fetch open sales + advance balance when customer changes
  useEffect(() => {
    if (!customerId) {
      setOpenSales([]);
      setAdvanceBalance(0);
      form.setValue("saleId", null);
      form.setValue("paymentMethod", "");
      return;
    }
    setLoadingSales(true);
    Promise.all([
      getOpenSalesForCustomer(workspaceId, customerId),
      getCustomerAdvanceBalance(workspaceId, customerId),
    ])
      .then(([salesResult, advResult]) => {
        setOpenSales(salesResult.sales as OpenSale[]);
        setAdvanceBalance(advResult.advance);
      })
      .catch(() => {
        setOpenSales([]);
        setAdvanceBalance(0);
      })
      .finally(() => setLoadingSales(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, workspaceId]);

  // When sale selection changes: auto-fill amount + method
  useEffect(() => {
    if (!saleId) {
      // Deselected sale — clear advance auto-fill if it was set
      if (form.getValues("paymentMethod") === "advance") {
        form.setValue("paymentMethod", "");
        form.setValue("amount", 0);
      }
      return;
    }

    const sale = openSales.find((s) => s.id === saleId);
    if (!sale) return;

    const remaining = sale.remaining_amount ?? sale.total;

    if (advanceBalance > 0) {
      // Auto-select advance and fill with min(advance, remaining)
      form.setValue("paymentMethod", "advance");
      form.setValue("amount", Math.min(advanceBalance, remaining));
    } else {
      form.setValue("amount", remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId, advanceBalance]);

  const onSubmit = async (data: CreatePaymentFormValues) => {
    const result =
      mode === "edit" && payment
        ? await updatePayment(workspaceId, payment.id, data)
        : await createPayment(workspaceId, data);

    if (result.success) {
      success(result.message);
      onSuccess?.();
      if (mode === "create") router.push("/payments");
    } else {
      error(result.message);
    }
  };

  // Show advance option in method dropdown only when a sale is linked and advance exists
  const availableMethods =
    saleId && advanceBalance > 0 ? PAYMENT_METHODS : REGULAR_PAYMENT_METHODS;

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <FormControl>
                      <Autocomplete
                        options={customers.map((c) => ({
                          id: c.id,
                          label: `${c.first_name} ${c.last_name}`,
                          subtitle: c.phone,
                        }))}
                        value={field.value || null}
                        onValueChange={(v) =>
                          form.setValue("customerId", v ?? "")
                        }
                        placeholder="Search customers..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice selector */}
              <FormField
                control={form.control}
                name="saleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Link to Invoice{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          form.setValue("saleId", e.target.value || null)
                        }
                        className={selectClass}
                        disabled={!customerId || loadingSales}
                      >
                        <option value="">
                          {loadingSales
                            ? "Loading invoices..."
                            : "Advance / Unlinked Payment"}
                        </option>
                        {openSales.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.invoice_number} — Rs.{" "}
                            {Number(
                              s.remaining_amount ?? s.total,
                            ).toLocaleString()}{" "}
                            remaining
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {customerId && !loadingSales && openSales.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No pending invoices for this customer
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Advance balance banner — shown when sale selected and advance exists */}
              {saleId && advanceBalance > 0 && (
                <div className="md:col-span-2 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <Wallet className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-800 dark:text-green-300">
                    Customer has{" "}
                    <strong>Rs. {advanceBalance.toLocaleString()}</strong>{" "}
                    advance balance — auto-selected as payment method
                  </span>
                </div>
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={selectClass}
                        disabled={form.formState.isSubmitting}
                      >
                        <option value="">Select payment method</option>
                        {availableMethods.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reference Number{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. TXN-12345"
                        {...field}
                        value={field.value ?? ""}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Notes{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Any additional notes..."
                        {...field}
                        value={field.value ?? ""}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {mode === "edit" ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {form.formState.isSubmitting
                      ? "Creating..."
                      : "Add Payment"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
