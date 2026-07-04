"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  id_number: string | null;
  credit_limit: number;
  opening_balance: number;
  current_balance: number;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface CustomersClientProps {
  customers: Customer[];
}

export default function CustomersClient({ customers }: CustomersClientProps) {
  const columns = [
    {
      key: "name" as const,
      label: "Name",
      sortable: true,
      render: (value: string, row: Customer) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-900">{value}</span>
            {row.email && <p className="text-sm text-gray-500">{row.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "phone" as const,
      label: "Phone",
      sortable: true,
      render: (value: string | null) => value || "-",
    },
    {
      key: "city" as const,
      label: "City",
      sortable: true,
      render: (value: string | null) => value || "-",
    },
    {
      key: "country" as const,
      label: "Country",
      sortable: true,
      render: (value: string | null) => value || "-",
    },
    {
      key: "credit_limit" as const,
      label: "Credit Limit",
      sortable: true,
      render: (value: number) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: "current_balance" as const,
      label: "Balance",
      sortable: true,
      render: (value: number) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: "is_active" as const,
      label: "Status",
      sortable: true,
      render: (value: boolean | null) => {
        const isActive = value !== false;
        const status = isActive ? "Active" : "Inactive";
        const colorClass = isActive
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800";
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
      render: (value: string) => (
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
            Add customer
          </Link>
        </Button>
      </div>

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
                  Add customer
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
