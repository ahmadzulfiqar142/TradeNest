"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building2, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  {
    name: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Your personal information",
  },
  {
    name: "Workspace",
    href: "/settings/workspace",
    icon: Building2,
    description: "Business details & branding",
  },
  {
    name: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Alerts and preferences",
  },
  {
    name: "Security",
    href: "/settings/security",
    icon: Shield,
    description: "Password and access",
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 shrink-0 border-r bg-white">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      </div>
      <nav className="space-y-1 p-3">
        {settingsNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-blue-600" : "text-gray-400",
                )}
              />
              <div>
                <p className="text-sm font-medium leading-none">{item.name}</p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    isActive ? "text-blue-500" : "text-gray-400",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
