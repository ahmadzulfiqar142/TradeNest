import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  ImageIcon,
  Package,
  Pencil,
  Plus,
  Tags,
} from "lucide-react";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, image_url, category_id, purchase_price, selling_price, stock_quantity, min_stock_quantity, is_active, created_at",
      )
      .eq("workspace_id", workspaceId)
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
  const lowStockCount = productRows.filter(
    (p) => p.stock_quantity <= (p.min_stock_quantity ?? 0),
  ).length;
  const inventoryValue = productRows.reduce(
    (total, p) => total + Number(p.purchase_price) * p.stock_quantity,
    0,
  );
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
        lowStockCount,
        inventoryValue,
      }}
    />
  );
}
