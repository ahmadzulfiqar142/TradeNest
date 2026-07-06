"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { createPayment, updatePayment } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PAYMENT_METHODS, createPaymentSchema, type CreatePaymentFormValues } from "@/schemas/payment";
import { useToast } from "@/hooks/use-toast";

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

const selectClass = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted";

export function PaymentForm({ workspaceId, mode = "create", payment, customers, openSales = [], preselectedSaleId, onSuccess }: PaymentFormProps) {
  const router = useRouter();
  const { success, error } = useToast();

  const form = useForm<CreatePaymentFormValues>({
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

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer — uses Autocomplete, wired via form.setValue */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <FormControl>
                      <Autocomplete
                        options={customers.map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}`, subtitle: c.phone }))}
                        value={field.value}
                        onValueChange={(v) => form.setValue("customerId", v ?? "")}
                        placeholder="Search customers..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {openSales.length > 0 && (
                <FormField
                  control={form.control}
                  name="saleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Invoice <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                      <FormControl>
                        <select {...field} value={field.value ?? ""} className={selectClass}>
                          <option value="">Advance / Unlinked Payment</option>
                          {openSales.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.invoice_number} — Rs. {Number(s.total).toLocaleString()} ({s.status})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} disabled={form.formState.isSubmitting} />
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
                      <select {...field} className={selectClass} disabled={form.formState.isSubmitting}>
                        <option value="">Select payment method</option>
                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
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
                      <Input type="date" {...field} disabled={form.formState.isSubmitting} />
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
                    <FormLabel>Reference Number <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TXN-12345" {...field} value={field.value ?? ""} disabled={form.formState.isSubmitting} />
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
                    <FormLabel>Notes <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Any additional notes..." {...field} value={field.value ?? ""} disabled={form.formState.isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {mode === "edit" ? (
                  <><Save className="h-4 w-4 mr-2" />{form.formState.isSubmitting ? "Saving..." : "Save Changes"}</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" />{form.formState.isSubmitting ? "Creating..." : "Add Payment"}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
