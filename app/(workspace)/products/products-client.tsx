"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ImageIcon,
  Boxes,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/confirm-dialog";
import { deleteProduct } from "@/actions/product";

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
  workspaceId: string;
}

export default function ProductsClient({
  products,
  categoryNames,
  stats,
  workspaceId,
}: ProductsClientProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  async function handleDelete() {
    if (!productToDelete) return;
    const result = await deleteProduct(workspaceId, productToDelete);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.message);
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  }

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
          <span className="font-medium text-white">{value}</span>
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
    {
      key: "id" as const,
      label: "Actions",
      sortable: false,
      render: (_value: string, row: Product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/products/${row.id}/edit`}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-400 focus:text-red-300"
              onClick={() => {
                setProductToDelete(row.id);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <p className="text-sm text-gray-400">Active Products</p>
          <p className="text-2xl font-bold text-gray-100">
            {stats.activeProducts}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <p className="text-sm text-gray-400">Categories</p>
          <p className="text-2xl font-bold text-gray-100">
            {stats.totalCategories}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <p className="text-sm text-gray-400">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-400">
            {stats.lowStockCount}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <p className="text-sm text-gray-400">Inventory Value</p>
          <p className="text-2xl font-bold text-gray-100">
            Rs {stats.inventoryValue.toLocaleString()}
          </p>
        </div>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
