"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { TopicList } from "@/components/forum/TopicList";
import { CreateTopicModal } from "@/components/forum/CreateTopicModal";
import { ProductForm } from "@/components/forms/ProductForm";
import { getTopicsByProduct } from "@/lib/forum-data";
import { Plus, Pencil, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Boxes, DollarSign, Package, Tags } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  category_id: string | null;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_quantity: number | null;
  is_active: boolean | null;
  created_at: string;
}

interface ProductsClientProps {
  products: Product[];
  categoryNames: Map<string, string>;
  stats: {
    activeProducts: number;
    totalCategories: number;
    lowStockCount: number;
    inventoryValue: number;
  };
}

export default function ProductsClient({
  products,
  categoryNames,
  stats,
}: ProductsClientProps) {
  const [activeTab, setActiveTab] = useState<"table" | "form" | "forum">(
    "table",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("1");

  const productForumTopics = getTopicsByProduct(selectedProductId);

  const columns = [
    {
      key: "name" as const,
      label: "Product Name",
      sortable: true,
      render: (value: string, row: Product) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <div
              className="h-10 w-10 rounded-md border bg-cover bg-center"
              style={{ backgroundImage: `url(${row.image_url})` }}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-gray-50">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: "sku" as const,
      label: "SKU",
      sortable: true,
      render: (value: string) => value,
    },
    {
      key: "category_id" as const,
      label: "Category",
      sortable: true,
      render: (value: string | null) =>
        value ? (categoryNames.get(value) ?? "Unknown") : "Uncategorized",
    },
    {
      key: "stock_quantity" as const,
      label: "Stock",
      sortable: true,
      render: (value: number) => value,
    },
    {
      key: "purchase_price" as const,
      label: "Cost",
      sortable: true,
      render: (value: number) => `Rs ${Number(value).toFixed(2)}`,
    },
    {
      key: "selling_price" as const,
      label: "Price",
      sortable: true,
      render: (value: number) => `Rs ${Number(value).toFixed(2)}`,
    },
    {
      key: "stock_quantity" as const,
      label: "Status",
      sortable: false,
      render: (value: number, row: Product) => {
        const isLowStock = value <= (row.min_stock_quantity ?? 0);
        const status = isLowStock ? "Low Stock" : "In Stock";
        const colorClass = isLowStock
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Products</h1>
          <p className="text-gray-400">
            Manage products, images, categories, and stock.
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      {/* Products Table Tab */}
      {activeTab === "table" && (
        <div className="rounded-lg border border-gray-700 bg-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              Products List
            </h2>
            {products.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-gray-600 text-center">
                <div className="rounded-full bg-gray-700 p-3">
                  <Boxes className="h-6 w-6 text-gray-400" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-200">
                  No products yet
                </h2>
                <p className="mt-1 max-w-sm text-sm text-gray-400">
                  Add your first product with opening stock to start building
                  inventory history.
                </p>
                <Button className="mt-5" asChild>
                  <Link href="/products/new">
                    <Plus className="h-4 w-4" />
                    Add product
                  </Link>
                </Button>
              </div>
            ) : (
              <DataTable
                data={products}
                columns={columns}
                title=""
                searchPlaceholder="Search products..."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
