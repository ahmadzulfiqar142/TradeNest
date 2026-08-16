import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";

export default async function CurrentStockPage() {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");
  const supabase = await createClient();
  const [
    { data: inventory },
    { data: products },
    { data: units },
    { data: productUnits },
  ] = await Promise.all([
    supabase
      .from("inventory")
      .select("product_id, base_unit_id, current_stock, minimum_stock")
      .eq("workspace_id", workspaceId),
    supabase
      .from("products")
      .select("id, name, sku")
      .eq("workspace_id", workspaceId),
    supabase.from("units").select("id, symbol"),
    supabase
      .from("product_units")
      .select("product_id, unit_id, conversion_factor, is_default"),
  ]);
  const productNames = new Map(
    (products ?? []).map((product) => [product.id, product]),
  );
  const unitSymbols = new Map(
    (units ?? []).map((unit) => [unit.id, unit.symbol]),
  );
  const unitNames = unitSymbols;

  // Group product_units by product_id
  const puByProduct = new Map<
    string,
    { unit_id: string; conversion_factor: number; is_default: boolean }[]
  >();
  for (const pu of productUnits ?? []) {
    const list = puByProduct.get(pu.product_id) ?? [];
    list.push(pu);
    puByProduct.set(pu.product_id, list);
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Current stock</h1>
        <p className="text-muted-foreground">
          Balances are shown in each product’s base unit.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Product</th>
              <th>Stock (base unit)</th>
              <th>Conversions</th>
              <th>Min stock</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {inventory?.map((item) => {
              const product = productNames.get(item.product_id);
              const low = item.current_stock <= item.minimum_stock;
              const baseSymbol = unitNames.get(item.base_unit_id) ?? "unit";
              const pUnits = puByProduct.get(item.product_id) ?? [];
              // Show stock converted into every non-default unit (only if stock > 0)
              const conversions = pUnits
                .filter(
                  (pu) =>
                    !pu.is_default &&
                    pu.conversion_factor > 0 &&
                    Number(item.current_stock) > 0,
                )
                .map((pu) => {
                  const qty = Number(item.current_stock) / pu.conversion_factor;
                  const sym = unitSymbols.get(pu.unit_id) ?? "unit";
                  return `${qty % 1 === 0 ? qty : qty.toFixed(3)} ${sym}`;
                });
              return (
                <tr key={item.product_id} className="border-t">
                  <td className="p-3 font-medium">
                    {product?.name ?? "Unknown"}
                    <span className="block text-xs text-muted-foreground">
                      {product?.sku}
                    </span>
                  </td>
                  <td>
                    {item.current_stock} {baseSymbol}
                  </td>
                  <td className="text-muted-foreground text-xs">
                    {conversions.length > 0 ? conversions.join(" · ") : "—"}
                  </td>
                  <td>
                    {item.minimum_stock} {baseSymbol}
                  </td>
                  <td>
                    {item.current_stock === 0
                      ? "Out of stock"
                      : low
                        ? "Low stock"
                        : "In stock"}
                  </td>
                  <td className="space-x-3">
                    <Link
                      className="text-primary"
                      href="/inventory/adjustments"
                    >
                      Adjust
                    </Link>
                    <Link className="text-primary" href="/inventory/history">
                      History
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!inventory?.length && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  No inventory records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
