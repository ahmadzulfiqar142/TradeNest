"use client";

import { usePathname } from "next/navigation";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { SettingsSidebar } from "@/features/settings/components/settings-sidebar";

interface SidebarSwitcherProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  userRole: string;
}

export function SidebarSwitcher({ workspace, userRole }: SidebarSwitcherProps) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith("/settings");

  if (isSettings) {
    return <SettingsSidebar />;
  }

  return <WorkspaceSidebar workspace={workspace} userRole={userRole} />;
}
