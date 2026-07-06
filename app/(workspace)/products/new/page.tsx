import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add product</h1>
            <p className="text-sm text-muted-foreground">
              Create a product with image, price, stock, and category.
            </p>
          </div>
          <Button
            variant="outline"
            asChild
          >
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
              Products
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <CreateProductForm
            workspaceId={workspaceId}
            workspaceSlug=""
            categories={categories ?? []}
          />
        </div>
      </div>
    </div>
  );
}
