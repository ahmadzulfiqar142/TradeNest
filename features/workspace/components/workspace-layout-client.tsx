"use client";

import { useState } from "react";
import { SidebarSwitcher } from "@/features/workspace/components/sidebar-switcher";
import { TopNav } from "@/features/workspace/components/workspace-header";
import { MobileNav } from "@/features/workspace/components/mobile-nav";

interface WorkspaceLayoutClientProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  userRole: string;
  user: {
    id: string;
    email?: string;
  };
  children: React.ReactNode;
}

export function WorkspaceLayoutClient({
  workspace,
  userRole,
  user,
  children,
}: WorkspaceLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarSwitcher workspace={workspace} userRole={userRole} />
      <div className="flex flex-col flex-1 w-full md:ml-64">
        <TopNav
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
}
