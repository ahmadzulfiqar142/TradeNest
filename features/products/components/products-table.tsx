"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ImageIcon, Pencil, Plus, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Product = {
  id: string;
  name: string;
  image_url: string | null;
  category_id: string | null;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_quantity: number | null;
  is_active: boolean | null;
};

interface ProductsTableProps {
  products: Product[];
  categoryNames: Record<string, string>;
}

export function ProductsTable({ products, categoryNames }: ProductsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.category_id && categoryNames[p.category_id]?.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && products.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <div className="rounded-full bg-blue-50 p-3">
            <Boxes className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-[#111827]">No products yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[#6B7280]">
            Add your first product with opening stock to start building inventory history.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          <Search className="h-8 w-8 text-[#D1D5DB]" />
          <p className="mt-3 text-sm font-medium text-[#111827]">No results for &quot;{query}&quot;</p>
          <p className="mt-1 text-sm text-[#6B7280]">Try a different name or category.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-[#6B7280]">
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
              {filtered.map((product) => {
                const minStock = product.min_stock_quantity ?? 0;
                const isLowStock = product.stock_quantity <= minStock;
                return (
                  <tr key={product.id} className="align-middle hover:bg-[#F9FAFB]">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <div
                            className="h-10 w-10 rounded-md border bg-cover bg-center"
                            style={{ backgroundImage: `url(${product.image_url})` }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-[#F9FAFB]">
                            <ImageIcon className="h-4 w-4 text-[#9CA3AF]" />
                          </div>
                        )}
                        <span className="font-medium text-[#111827]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#6B7280]">
                      {product.category_id ? categoryNames[product.category_id] ?? "Unknown" : "Uncategorized"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#111827]">{product.stock_quantity}</div>
                      <div className="text-xs text-[#9CA3AF]">Min {minStock}</div>
                    </td>
                    <td className="px-4 py-4 text-[#6B7280]">Rs {Number(product.purchase_price).toFixed(2)}</td>
                    <td className="px-4 py-4 text-[#6B7280]">Rs {Number(product.selling_price).toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <span className={isLowStock
                        ? "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                        : "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                      }>
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
    </div>
  );
}
