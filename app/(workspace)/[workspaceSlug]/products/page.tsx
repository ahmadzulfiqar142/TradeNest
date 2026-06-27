import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500">Manage your product catalog</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Products Module</CardTitle>
              <CardDescription>
                This feature is under development
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            The products module will include:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Product list with search and filters</li>
            <li>• Add/Edit product forms</li>
            <li>• Category management</li>
            <li>• SKU and barcode generation</li>
            <li>• Stock tracking</li>
            <li>• Image uploads</li>
            <li>• Bulk import/export</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
