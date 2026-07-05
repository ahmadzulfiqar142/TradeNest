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
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const params = await searchParams;

  const [paymentsResult, { data: customers }, { data: products }] =
    await Promise.all([
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
      supabase
        .from("products")
        .select("id, name, selling_price, stock_quantity, unit")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  // Debug logging
  if (paymentsResult.error) {
    console.error("Error fetching payments:", paymentsResult.error);
  }
  console.log("Payments result:", {
    count: paymentsResult.payments?.length || 0,
    error: paymentsResult.error,
    workspaceId,
    searchParams: params,
  });

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
          products={products ?? []}
          workspaceId={workspaceId}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
