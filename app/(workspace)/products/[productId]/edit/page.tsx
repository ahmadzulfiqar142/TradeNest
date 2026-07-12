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

  const [{ data: product }, { data: categories }, { data: units }, { data: productUnits }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, description, image_url, category_id, is_active",
      )
      .eq("workspace_id", workspaceId)
      .eq("id", productId)
      .single(),
    supabase
      .from("categories")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true }),
    supabase.from("units").select("id, name, symbol").order("name", { ascending: true }),
    supabase.from("product_units").select("id, unit_id, conversion_factor, is_default").eq("product_id", productId),
  ]);

  if (!product) notFound();

  const { data: prices } = productUnits?.length
    ? await supabase.from("product_prices").select("product_unit_id, selling_price, purchase_price").in("product_unit_id", productUnits.map((unit) => unit.id))
    : { data: [] };
  const productWithUnits = {
    ...product,
    units: (productUnits ?? []).map((unit) => {
      const price = prices?.find((item) => item.product_unit_id === unit.id);
      return { unitId: unit.unit_id, conversionFactor: Number(unit.conversion_factor), isDefault: unit.is_default, sellingPrice: Number(price?.selling_price ?? 0), purchasePrice: Number(price?.purchase_price ?? 0) };
    }),
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit product</h1>
            <p className="text-sm text-muted-foreground">
              Update product details, units, prices, and image.
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
              units={units ?? []}
              product={productWithUnits}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
