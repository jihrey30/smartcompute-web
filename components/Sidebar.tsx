'use client';

import Link from "next/link";
import { LayoutDashboard, Tags, CalendarClock, Settings, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function Sidebar() {
  const { logout } = useAuth();
  return (
    <aside className="w-64 border-r border-surface-border bg-surface flex flex-col hidden md:flex">
      <div className="h-20 flex items-center px-8 border-b border-surface-border">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          SmartCompute
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        <Link href="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium hover-lift">
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link href="/categories" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-surface-hover hover:text-foreground transition-colors hover-lift">
          <Tags className="w-5 h-5" />
          <span>Categories</span>
        </Link>
        <Link href="/templates" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-surface-hover hover:text-foreground transition-colors hover-lift">
          <CalendarClock className="w-5 h-5" />
          <span>Templates</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-surface-border">
        <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-surface-hover hover:text-foreground transition-colors hover-lift">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
        <button onClick={logout} className="w-full mt-2 flex items-center space-x-3 px-4 py-3 rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors hover-lift">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
