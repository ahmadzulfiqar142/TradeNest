import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Boxes, DollarSign, ImageIcon, Package, Pencil, Plus, Tags } from "lucide-react";

export default async function ProductsPage() {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, image_url, category_id, purchase_price, selling_price, stock_quantity, min_stock_quantity, is_active, created_at")
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
  const lowStockCount = productRows.filter((p) => p.stock_quantity <= (p.min_stock_quantity ?? 0)).length;
  const inventoryValue = productRows.reduce((total, p) => total + Number(p.purchase_price) * p.stock_quantity, 0);
  const activeProducts = productRows.filter((p) => p.is_active !== false).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage products, images, categories, and stock.</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active products</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeProducts}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Categories</CardTitle>
            <Tags className="h-5 w-5 text-violet-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{categoryRows.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low stock</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{lowStockCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inventory value</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">Rs {inventoryValue.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-xl">Product catalog</CardTitle></CardHeader>
        <CardContent>
          {productRows.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-center">
              <div className="rounded-full bg-blue-50 p-3">
                <Boxes className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">No products yet</h2>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Add your first product with opening stock to start building inventory history.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/products/new">
                  <Plus className="h-4 w-4" />
                  Add product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Cost</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="py-3 pl-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productRows.map((product) => {
                    const minimumStock = product.min_stock_quantity ?? 0;
                    const isLowStock = product.stock_quantity <= minimumStock;
                    return (
                      <tr key={product.id} className="align-middle">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <div className="h-12 w-12 rounded-md border bg-cover bg-center" style={{ backgroundImage: `url(${product.image_url})` }} aria-label={`${product.name} image`} />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-gray-50">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {product.category_id ? categoryNames.get(product.category_id) ?? "Unknown" : "Uncategorized"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{product.stock_quantity}</div>
                          <div className="text-xs text-gray-500">Min {minimumStock}</div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">Rs {Number(product.purchase_price).toFixed(2)}</td>
                        <td className="px-4 py-4 text-gray-600">Rs {Number(product.selling_price).toFixed(2)}</td>
                        <td className="px-4 py-4">
                          <span className={isLowStock ? "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700" : "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"}>
                            {isLowStock ? "Low stock" : "In stock"}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/products/${product.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
