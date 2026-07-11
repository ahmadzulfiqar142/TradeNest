import { Metadata } from "next";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import { ExpiryAlertsClient } from "./expiry-alerts-client";

export const metadata: Metadata = {
  title: "Expiry Alerts | TradeNest",
  description: "View products expiring soon and expired products",
};

export default async function ExpiryAlertsPage() {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) {
    notFound();
  }

  const supabase = await createClient();

  // Get products expiring within 30 days
  const { data: expiringProducts } = await supabase.rpc("get_expiry_alerts", {
    p_workspace_id: workspaceId,
    p_days_threshold: 30,
  });

  // Get low stock products
  const { data: lowStockProducts } = await supabase.rpc(
    "get_low_stock_products",
    {
      p_workspace_id: workspaceId,
    },
  );

  return (
    <ExpiryAlertsClient
      expiringProducts={expiringProducts || []}
      lowStockProducts={lowStockProducts || []}
    />
  );
}
