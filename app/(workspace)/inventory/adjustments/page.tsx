import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { InventoryAdjustmentForm } from "@/features/inventory/components/inventory-adjustment-form";

export default async function InventoryAdjustmentsPage() {
  const workspaceId = await getActiveWorkspaceId(); if (!workspaceId) redirect("/create-workspace");
  const supabase = await createClient();
  const [{ data: inventory }, { data: products }, { data: units }] = await Promise.all([
    supabase.from("inventory").select("product_id, base_unit_id").eq("workspace_id", workspaceId),
    supabase.from("products").select("id, name").eq("workspace_id", workspaceId).eq("is_active", true).order("name"),
    supabase.from("units").select("id, symbol"),
  ]);
  const unitNames = new Map((units ?? []).map(unit => [unit.id, unit.symbol])); const inventoryByProduct = new Map((inventory ?? []).map(item => [item.product_id, item]));
  const options = (products ?? []).filter(product => inventoryByProduct.has(product.id)).map(product => ({ id: product.id, name: product.name, unit: unitNames.get(inventoryByProduct.get(product.id)!.base_unit_id) ?? "unit" }));
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Stock adjustment</h1><p className="text-muted-foreground">Increase or decrease stock with a recorded reason.</p></div><InventoryAdjustmentForm workspaceId={workspaceId} products={options} /></div>;
}
