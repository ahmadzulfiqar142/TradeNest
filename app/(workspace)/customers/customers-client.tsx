"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Eye, Trash2, Archive, MoreVertical } from "lucide-react";
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
import { deleteCustomer, archiveCustomer } from "@/actions/customer";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string | null;
  city: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface CustomersClientProps {
  customers: Customer[];
  workspaceId: string;
}

export default function CustomersClient({
  customers,
  workspaceId,
}: CustomersClientProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const { success, error } = useToast();

  async function handleDelete() {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteCustomer(workspaceId, customerToDelete);
      if (result.success) {
        success(result.message);
        window.location.reload();
      } else {
        error(result.message);
      }
    } catch {
      error("Failed to delete customer");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  }

  async function handleArchive(customerId: string) {
    setArchiving(true);
    try {
      const result = await archiveCustomer(workspaceId, customerId);
      if (result.success) {
        success(result.message);
        window.location.reload();
      } else {
        error(result.message);
      }
    } catch {
      error("Failed to archive customer");
    } finally {
      setArchiving(false);
    }
  }

  const columns = [
    {
      key: "first_name" as const,
      label: "Customer Name",
      sortable: true,
      render: (_value: string, row: Customer) => {
        const fullName = `${row.first_name} ${row.last_name}`.trim();
        return (
          <Link
            href={`/customers/${row.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {row.first_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-foreground">{fullName}</span>
              {row.phone && (
                <p className="text-sm text-muted-foreground">{row.phone}</p>
              )}
            </div>
          </Link>
        );
      },
    },
    {
      key: "phone" as const,
      label: "Phone Number",
      sortable: true,
      render: (value: string) => value || "-",
    },
    {
      key: "city" as const,
      label: "City",
      sortable: true,
      render: (value: string | null) => value || "-",
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (value: string) => {
        const isActive = value === "Active";
        const colorClass = isActive
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-muted text-muted-foreground";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "id" as const,
      label: "Actions",
      sortable: false,
      render: (value: string, row: Customer) => (
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
                href={`/customers/${value}`}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/customers/${value}/edit`}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleArchive(value)}
              disabled={archiving}
            >
              <Archive className="h-4 w-4" />
              {archiving ? "Archiving..." : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-400 focus:text-red-300"
              onClick={() => {
                setCustomerToDelete(value);
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
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information and balances.
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Customers Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Customers List
          </h2>
          {customers.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <div className="rounded-full bg-muted p-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                No customers yet
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Add your first customer to start managing relationships and
                tracking balances.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/customers/new">
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Link>
              </Button>
            </div>
          ) : (
            <DataTable
              data={customers}
              columns={columns}
              title=""
              searchPlaceholder="Search customers..."
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot
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
