"use client";

import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface TopNavProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export function TopNav({ onMenuClick, isMobileMenuOpen }: TopNavProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check current dark mode state
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isCurrentlyDark = html.classList.contains("dark");

    if (isCurrentlyDark) {
      // Currently dark, switch to light
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      // Currently light, switch to dark
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-30 w-full bg-card border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:pl-0 md:pr-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden text-foreground hover:bg-muted p-2 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Workspace Selector */}
          <button className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground">
            <span>Workspace</span>
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 text-foreground hover:bg-muted rounded-lg transition-colors group"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            <span className="sr-only">3 unread notifications</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User Menu with Logout */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signout } = useAuth();

  const handleLogout = async () => {
    try {
      await signout();
      setIsOpen(false);
      // Redirect to login page after logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {user?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[100px] truncate">
          {user?.email?.split("@")[0] || "User"}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-card border border-border shadow-lg z-50 py-1">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
