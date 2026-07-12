import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";

export default async function LowStockPage() {
  const workspaceId = await getActiveWorkspaceId(); if (!workspaceId) redirect("/create-workspace"); const supabase = await createClient();
  const [{ data: inventory }, { data: products }, { data: units }] = await Promise.all([supabase.from("inventory").select("product_id, base_unit_id, current_stock, minimum_stock").eq("workspace_id", workspaceId), supabase.from("products").select("id, name").eq("workspace_id", workspaceId), supabase.from("units").select("id, symbol")]);
  const names = new Map((products ?? []).map(product => [product.id, product.name])); const symbols = new Map((units ?? []).map(unit => [unit.id, unit.symbol])); const lowStock = (inventory ?? []).filter(item => item.current_stock <= item.minimum_stock);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Low stock</h1><p className="text-muted-foreground">Products whose current stock is at or below the configured minimum.</p></div><div className="rounded-lg border bg-card"><ul className="divide-y">{lowStock.map(item => <li key={item.product_id} className="flex items-center justify-between p-4"><div><p className="font-medium">{names.get(item.product_id) ?? "Unknown product"}</p><p className="text-sm text-muted-foreground">Current {item.current_stock} {symbols.get(item.base_unit_id)} · Minimum {item.minimum_stock}</p></div><Link className="text-sm text-primary" href="/inventory/adjustments">Adjust stock</Link></li>)}{!lowStock.length && <li className="p-8 text-center text-muted-foreground">No low-stock products.</li>}</ul></div></div>;
}
