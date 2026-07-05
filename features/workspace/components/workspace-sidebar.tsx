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
  UserCircle,
  ChevronRight,
  Bell,
  MessageSquare,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  userRole: string;
  isOpen?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Suppliers", href: "/suppliers", icon: UserCircle },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Forum", href: "/forum", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  workspace,
  isOpen = true,
  onCollapseChange,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-20" : "w-64",
        "max-md:hidden",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">
              {workspace.name}
            </span>
          </div>
        )}
        <button
          onClick={handleToggleCollapse}
          className="text-sidebar-foreground hover:text-sidebar-accent transition-colors"
          aria-name={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              isCollapsed ? "rotate-180" : "",
            )}
          />
        </button>
      </div>

      {/* Workspace Selector */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <button className="w-full px-3 py-2 rounded-lg bg-sidebar-accent/10 text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors text-sm font-medium flex items-center justify-between">
            <span>Workspace</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    active
                      ? "bg-sidebar-accent/20 text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10",
                  )}
                  title={isCollapsed ? item.name : ""}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      {!isCollapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors text-sm">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold flex-shrink-0">
              U
            </div>
            <div className="text-left min-w-0">
              <p className="font-medium truncate">User</p>
              <p className="text-xs opacity-75 truncate">user@example.com</p>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
