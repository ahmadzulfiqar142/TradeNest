import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateProductForm } from "@/features/products/components/create-product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { productId } = await params;

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, description, image_url, category_id, purchase_price, selling_price, stock_quantity, min_stock_quantity, expiry_date",
      )
      .eq("workspace_id", workspaceId)
      .eq("id", productId)
      .single(),
    supabase
      .from("categories")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true }),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
            <p className="text-sm text-gray-500">
              Update product details, image, price, and stock.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
              Products
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <CreateProductForm
              mode="edit"
              workspaceId={workspaceId}
              workspaceSlug=""
              categories={categories ?? []}
              product={product}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
