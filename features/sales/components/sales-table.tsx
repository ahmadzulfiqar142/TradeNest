"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, MoreVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { deleteSale } from "@/actions/sale";
import { SALE_STATUS_LABELS, SALE_STATUS_COLORS } from "@/schemas/sale";

type Sale = {
  id: string;
  invoice_number: string;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  sale_date: string;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
};

type SalesTableProps = {
  sales: Sale[];
  workspaceId: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export function SalesTable({ sales, workspaceId }: SalesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = s.customers
          ? `${s.customers.first_name} ${s.customers.last_name}`.toLowerCase()
          : "";
        return (
          s.invoice_number.toLowerCase().includes(q) ||
          name.includes(q) ||
          (s.customers?.phone ?? "").includes(q)
        );
      }
      return true;
    });
  }, [sales, search, statusFilter]);

  async function handleDelete() {
    if (!saleToDelete) return;
    const result = await deleteSale(workspaceId, saleToDelete);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message);
    }
    setDeleteDialogOpen(false);
    setSaleToDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input
            placeholder="Search invoice, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button asChild>
          <Link href="/sales/new">
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Link>
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No sales found</p>
              <Button asChild className="mt-4" variant="secondary">
                <Link href="/sales/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create first sale
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sale) => {
                    const outstanding =
                      Number(sale.total) - Number(sale.paid_amount);
                    return (
                      <TableRow
                        key={sale.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/sales/${sale.id}`)}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {sale.invoice_number}
                        </TableCell>
                        <TableCell>
                          {sale.customers ? (
                            <div>
                              <p className="font-medium text-sm">
                                {sale.customers.first_name}{" "}
                                {sale.customers.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sale.customers.phone}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Walk-in
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rs. {Number(sale.total).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600 text-sm">
                          Rs. {Number(sale.paid_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {outstanding > 0 ? (
                            <span className="text-red-500">
                              Rs. {outstanding.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              SALE_STATUS_COLORS[sale.status] ??
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {SALE_STATUS_LABELS[sale.status] ?? sale.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/sales/${sale.id}`}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              {(sale.status === "pending" ||
                                sale.status === "cancelled") && (
                                <DropdownMenuItem
                                  className="text-red-400 focus:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSaleToDelete(sale.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sale? This action cannot be
              undone.
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
