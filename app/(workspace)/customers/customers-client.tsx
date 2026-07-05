"use client";

import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Pencil, Eye, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCustomer, archiveCustomer } from "@/actions/customer";

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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
              {row.first_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-white">{fullName}</span>
              {row.phone && (
                <p className="text-sm text-gray-500">{row.phone}</p>
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
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800";
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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Link href={`/customers/${value}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Link href={`/customers/${value}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <form
            action={async (formData: FormData) => {
              await archiveCustomer(workspaceId, value);
            }}
            className="inline"
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-yellow-400 hover:text-yellow-300 hover:bg-gray-700"
              title="Archive"
            >
              <Archive className="h-4 w-4" />
            </Button>
          </form>
          <form
            action={async (formData: FormData) => {
              if (confirm("Are you sure you want to delete this customer?")) {
                await deleteCustomer(workspaceId, value);
              }
            }}
            className="inline"
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-gray-700"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Customers</h1>
          <p className="text-gray-400">
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
      <div className="rounded-lg border border-gray-700 bg-gray-800">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Customers List
          </h2>
          {customers.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-gray-600 text-center">
              <div className="rounded-full bg-gray-700 p-3">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-200">
                No customers yet
              </h2>
              <p className="mt-1 max-w-sm text-sm text-gray-400">
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
    </div>
  );
}
