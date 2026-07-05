import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { getSales } from "@/actions/sale";
import { SalesTable } from "@/features/sales/components/sales-table";

export const metadata: Metadata = {
  title: "Sales | TradeNest",
  description: "Manage sales and invoices",
};

interface SalesPageProps {
  searchParams: Promise<{
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const params = await searchParams;
  const { sales } = await getSales(workspaceId, {
    status: params.status,
    customerId: params.customerId,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales</h1>
        <p className="text-muted-foreground mt-1">Create and manage sales invoices</p>
      </div>
      <SalesTable sales={sales} workspaceId={workspaceId} />
    </div>
  );
}
