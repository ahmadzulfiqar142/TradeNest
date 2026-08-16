import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { StockInForm } from "@/features/inventory/components/stock-in-form";

export default async function StockInPage() {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const supabase = await createClient();

  const [{ data: products }, { data: productUnits }, { data: units }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, is_active")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("product_units")
        .select("id, product_id, unit_id, conversion_factor"),
      supabase.from("units").select("id, symbol"),
    ]);

  // Build unit symbol lookup
  const unitSymbols = new Map((units ?? []).map((u) => [u.id, u.symbol]));

  // Group product_units by product_id
  const unitsByProduct = new Map<
    string,
    Array<{ id: string; symbol: string; conversionFactor: number }>
  >();
  for (const pu of productUnits ?? []) {
    const symbol = unitSymbols.get(pu.unit_id);
    if (!symbol) continue;
    const list = unitsByProduct.get(pu.product_id) ?? [];
    list.push({
      id: pu.id,           // product_units.id — what stock_in_batch RPC expects
      symbol,
      conversionFactor: Number(pu.conversion_factor),
    });
    unitsByProduct.set(pu.product_id, list);
  }

  // Build product options with their units
  const productOptions = (products ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    units: unitsByProduct.get(product.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock in</h1>
        <p className="text-muted-foreground">
          Receive new stock with batch tracking and expiry dates.
        </p>
      </div>
      <StockInForm workspaceId={workspaceId} products={productOptions} />
    </div>
  );
}
