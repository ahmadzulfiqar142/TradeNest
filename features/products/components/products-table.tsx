"use client";

import Link from "next/link";
import { Pencil, Plus, Boxes, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";

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
  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Product",
      render: (value, row) => (
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
          <span className="font-medium text-foreground">{value as string}</span>
        </div>
      ),
    },
    {
      key: "category_id",
      label: "Category",
      render: (value) => {
        const categoryName = value
          ? (categoryNames[value as string] ?? "Unknown")
          : "Uncategorized";
        return <span className="text-muted-foreground">{categoryName}</span>;
      },
    },
    {
      key: "stock_quantity",
      label: "Stock",
      render: (value, row) => (
        <div>
          <div className="font-medium text-foreground">{value as number}</div>
          <div className="text-xs text-muted-foreground">
            Min {row.min_stock_quantity ?? 0}
          </div>
        </div>
      ),
    },
    {
      key: "purchase_price",
      label: "Cost",
      render: (value) => (
        <span className="text-muted-foreground">
          Rs {Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      key: "selling_price",
      label: "Price",
      render: (value) => (
        <span className="text-muted-foreground">
          Rs {Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      key: "stock_quantity",
      label: "Status",
      sortable: true,
      render: (value, row) => {
        const minStock = row.min_stock_quantity ?? 0;
        const isLowStock = (value as number) <= minStock;
        return (
          <span
            className={
              isLowStock
                ? "inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"
                : "inline-flex rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500"
            }
          >
            {isLowStock ? "Low stock" : "In stock"}
          </span>
        );
      },
    },
    {
      key: "id",
      label: "Action",
      render: (_, row) => (
        <div className="text-right">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${row.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  if (products.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Boxes className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          No products yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add your first product with opening stock to start building inventory
          history.
        </p>
        <Button className="mt-5" asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <DataTable
      data={products}
      columns={columns}
      title="Products"
      searchPlaceholder="Search products..."
    />
  );
}
