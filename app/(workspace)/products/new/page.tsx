import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProductForm } from "@/features/products/components/create-product-form";

export default async function NewProductPage() {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add product</h1>
          <p className="text-gray-500">Create a product with image, price, stock, and category.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
            Products
          </Link>
        </Button>
      </div>

      <Card className="max-w-3xl">
        <CardHeader><CardTitle className="text-xl">Product details</CardTitle></CardHeader>
        <CardContent>
          <CreateProductForm
            workspaceId={workspaceId}
            workspaceSlug=""
            categories={categories ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
