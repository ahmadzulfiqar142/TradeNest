import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function InventoryHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: transactions }, { data: products }, { data: units }] =
    await Promise.all([
      supabase
        .from("inventory_transactions")
        .select(
          "id, product_id, transaction_type, quantity, new_stock, reference_type, notes, created_at, inventory(base_unit_id)",
          { count: "exact", head: false },
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase
        .from("products")
        .select("id, name")
        .eq("workspace_id", workspaceId),
      supabase.from("units").select("id, symbol"),
    ]);

  const { count } = await supabase
    .from("inventory_transactions")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const names = new Map(
    (products ?? []).map((product) => [product.id, product.name]),
  );
  const unitSymbols = new Map((units ?? []).map((u) => [u.id, u.symbol]));
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  const buildPageHref = (targetPage: number) =>
    `/inventory/history?page=${targetPage}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory history</h1>
        <p className="text-muted-foreground">
          Every stock movement and its resulting balance.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Date</th>
              <th>Product</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Balance</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((item) => {
              const inv = item.inventory as { base_unit_id: string } | null;
              const unit = inv ? (unitSymbols.get(inv.base_unit_id) ?? "unit") : "unit";
              return (
              <tr key={item.id} className="border-t">
                <td className="p-3">
                  {new Date(item.created_at).toLocaleString()}
                </td>
                <td className="font-medium">
                  {names.get(item.product_id) ?? "Unknown"}
                </td>
                <td className="capitalize">{item.transaction_type}</td>
                <td>
                  {Number(item.quantity) > 0 ? "+" : ""}
                  {item.quantity} {unit}
                </td>
                <td>{item.new_stock} {unit}</td>
                <td>{item.notes ?? item.reference_type ?? "—"}</td>
              </tr>
            )})}
            {!transactions?.length && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  No inventory history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <a
              href={buildPageHref(Math.max(1, page - 1))}
              className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              aria-disabled={page <= 1}
            >
              Previous
            </a>
            <a
              href={buildPageHref(Math.min(totalPages, page + 1))}
              className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              aria-disabled={page >= totalPages}
            >
              Next
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
