import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";

export default async function InventoryHistoryPage() {
  const workspaceId = await getActiveWorkspaceId(); if (!workspaceId) redirect("/create-workspace"); const supabase = await createClient();
  const [{ data: transactions }, { data: products }] = await Promise.all([supabase.from("inventory_transactions").select("id, product_id, transaction_type, quantity, new_stock, reference_type, notes, created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }), supabase.from("products").select("id, name").eq("workspace_id", workspaceId)]);
  const names = new Map((products ?? []).map(product => [product.id, product.name]));
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Inventory history</h1><p className="text-muted-foreground">Every stock movement and its resulting balance.</p></div><div className="overflow-hidden rounded-lg border bg-card"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr><th className="p-3">Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Balance</th><th>Reference</th></tr></thead><tbody>{transactions?.map(item => <tr key={item.id} className="border-t"><td className="p-3">{new Date(item.created_at).toLocaleString()}</td><td className="font-medium">{names.get(item.product_id) ?? "Unknown"}</td><td className="capitalize">{item.transaction_type}</td><td>{Number(item.quantity) > 0 ? "+" : ""}{item.quantity}</td><td>{item.new_stock}</td><td>{item.notes ?? item.reference_type ?? "—"}</td></tr>)}{!transactions?.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No inventory history yet.</td></tr>}</tbody></table></div></div>;
}
