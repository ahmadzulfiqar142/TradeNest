import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, image_url, category_id, selling_price, is_active, created_at",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true }),
  ]);

  const productRows = products ?? [];
  const categoryRows = categories ?? [];
  const categoryNames = new Map(categoryRows.map((c) => [c.id, c.name]));
  const activeProducts = productRows.filter(
    (p) => p.is_active !== false,
  ).length;

  return (
    <ProductsClient
      products={productRows}
      categoryNames={categoryNames}
      stats={{
        activeProducts,
        totalCategories: categoryRows.length,
      }}
      workspaceId={workspaceId}
    />
  );
}
