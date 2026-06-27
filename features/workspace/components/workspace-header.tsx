"use client";

import { useState } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

interface WorkspaceHeaderProps {
  workspace: {
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email?: string;
  };
}

export function WorkspaceHeader({ workspace, user }: WorkspaceHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {workspace.name}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user.email}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg">
              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
