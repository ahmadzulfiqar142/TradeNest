"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/features/workspace/components/workspace-sidebar";
import { SettingsSidebar } from "@/features/settings/components/settings-sidebar";

interface SidebarSwitcherProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  userRole: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function SidebarSwitcher({
  workspace,
  userRole,
  onCollapseChange,
}: SidebarSwitcherProps) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith("/settings");

  if (isSettings) {
    return <SettingsSidebar />;
  }

  return (
    <Sidebar
      workspace={workspace}
      userRole={userRole}
      onCollapseChange={onCollapseChange}
    />
  );
}
