import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { getPayments } from "@/actions/payment";
import { PaymentsClient } from "./payments-client";

export const metadata: Metadata = {
  title: "Payments | TradeNest",
  description: "Manage customer payments",
};

interface PaymentsPageProps {
  searchParams: Promise<{
    customerId?: string;
    saleId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const params = await searchParams;

  const [paymentsResult, { data: customers }] = await Promise.all([
    getPayments(workspaceId, {
      customerId: params.customerId,
      paymentMethod: params.paymentMethod,
      startDate: params.startDate,
      endDate: params.endDate,
      search: params.search,
    }),
    supabase
      .from("customers")
      .select("id, first_name, last_name, phone")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("first_name", { ascending: true }),
  ]);

  // If coming from a sale detail page, fetch open sales for that customer
  let openSales: { id: string; invoice_number: string; total: number; status: string }[] = [];
  if (params.customerId) {
    const { data } = await supabase
      .from("sales")
      .select("id, invoice_number, total, status")
      .eq("workspace_id", workspaceId)
      .eq("customer_id", params.customerId)
      .in("status", ["pending", "partially_paid"])
      .order("sale_date", { ascending: false });
    openSales = data ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Manage and track all customer payments
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PaymentsClient
          payments={paymentsResult.payments ?? []}
          customers={customers ?? []}
          workspaceId={workspaceId}
          openSales={openSales}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
