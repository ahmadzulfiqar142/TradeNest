"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Settings,
  Warehouse,
  CreditCard,
  FileText,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  userRole: string;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: UserCircle },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];


export function WorkspaceSidebar({ workspace, userRole }: WorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r bg-white">
      {/* Workspace Logo/Name */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          {workspace.logo_url ? (
            <img
              src={workspace.logo_url}
              alt={workspace.name}
              className="h-8 w-8 rounded"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-semibold">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-lg font-semibold">{workspace.name}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Role Badge */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Your Role</p>
          <p className="text-sm font-medium capitalize text-gray-900">
            {userRole}
          </p>
        </div>
      </div>
    </div>
  );
}
