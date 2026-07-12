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
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  category_id: string | null;
  selling_price: number;
  is_active: boolean | null;
  created_at: string;
}

interface ProductsClientProps {
  products: Product[];
  categoryNames: Map<string, string>;
  stats: {
    activeProducts: number;
    totalCategories: number;
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
  const [deleting, setDeleting] = useState(false);
  const { success, error } = useToast();

  async function handleDelete() {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteProduct(workspaceId, productToDelete);
      if (result.success) {
        success(result.message);
        window.location.reload();
      } else {
        error(result.message);
      }
    } catch {
      error("Failed to delete product");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium text-foreground">{value}</span>
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
      key: "selling_price" as const,
      label: "Price",
      sortable: true,
      render: (value: number) => `Rs ${Number(value).toFixed(2)}`,
    },
    {
      key: "is_active" as const,
      label: "Status",
      sortable: false,
      render: (_value: boolean | null, row: Product) => {
        const status = row.is_active === false ? "Archived" : "Active";
        const colorClass = row.is_active === false ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-800";
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
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
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
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage product information, units, prices, images, and categories.
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Products</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.activeProducts}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.totalCategories}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Products List
          </h2>
          {products.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <div className="rounded-full bg-muted p-3">
                <Boxes className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                No products yet
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add your first product with its default unit and pricing.
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
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
