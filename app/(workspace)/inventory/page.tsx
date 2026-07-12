import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";

export default async function InventoryPage() {
  const workspaceId = await getActiveWorkspaceId(); if (!workspaceId) redirect("/create-workspace");
  const supabase = await createClient();
  const [{ data: rows }, { data: transactions }, { data: products }] = await Promise.all([
    supabase.from("inventory").select("product_id, current_stock, minimum_stock").eq("workspace_id", workspaceId),
    supabase.from("inventory_transactions").select("id, product_id, transaction_type, quantity, new_stock, created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("id, name, purchase_price").eq("workspace_id", workspaceId),
  ]);
  const inventory = rows ?? []; const names = new Map((products ?? []).map(product => [product.id, product.name]));
  const lowStock = inventory.filter(item => item.current_stock <= item.minimum_stock).length; const outOfStock = inventory.filter(item => item.current_stock === 0).length; const costs = new Map((products ?? []).map(product => [product.id, Number(product.purchase_price)])); const inventoryValue = inventory.reduce((total, item) => total + Number(item.current_stock) * (costs.get(item.product_id) ?? 0), 0);
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold">Inventory</h1><p className="text-muted-foreground">Monitor stock, adjustments, and movement history.</p></div><Button asChild><Link href="/inventory/adjustments">Adjust stock</Link></Button></div><div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{[["Tracked products", inventory.length], ["Inventory value", `Rs ${inventoryValue.toLocaleString()}`], ["Low stock", lowStock], ["Out of stock", outOfStock], ["Recent movements", transactions?.length ?? 0]].map(([label, value]) => <div key={String(label)} className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}</div><div className="rounded-lg border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent movements</h2><Link className="text-sm text-primary" href="/inventory/history">View all</Link></div><div className="space-y-3">{transactions?.map(item => <div key={item.id} className="flex justify-between text-sm"><span>{names.get(item.product_id) ?? "Unknown product"}</span><span className="text-muted-foreground">{item.transaction_type} · {Number(item.quantity) > 0 ? "+" : ""}{item.quantity} → {item.new_stock}</span></div>)}{!transactions?.length && <p className="text-sm text-muted-foreground">No movements recorded yet.</p>}</div></div></div>;
}
