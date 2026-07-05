import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { getProductsForSale, getCustomersForSale } from "@/actions/sale";
import { SaleForm } from "@/features/sales/components/sale-form";

export const metadata: Metadata = {
  title: "New Sale | TradeNest",
};

export default async function NewSalePage() {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const [{ products }, { customers }] = await Promise.all([
    getProductsForSale(workspaceId),
    getCustomersForSale(workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Sales</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">New Sale</h1>
        <p className="text-muted-foreground mt-1">Create a new sales invoice</p>
      </div>

      <SaleForm
        workspaceId={workspaceId}
        products={products}
        customers={customers}
      />
    </div>
  );
}
