'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tags, Settings, LogOut, Zap, Wallet, ListChecks, ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useUI } from "./ui/UIProvider";
import { cn } from "@/lib/utils";

const SidebarItem = ({ href, icon: Icon, label, danger, pathname, effectiveCollapsed, buttonStyle, logout }: { href?: string, icon: LucideIcon, label: string, danger?: boolean, pathname: string, effectiveCollapsed: boolean, buttonStyle: string, logout: () => void }) => {
  const isActive = pathname === href;
  const showIcon = effectiveCollapsed || buttonStyle === "BOTH";
  const showText = !effectiveCollapsed && (buttonStyle === "BOTH" || buttonStyle === "TEXT");

  const content = (
    <>
      {showIcon && <Icon className="w-5 h-5 flex-shrink-0" />}
      {showText && <span className="font-medium whitespace-nowrap">{label}</span>}
      
      {/* Tooltip for collapsed or icon-only state */}
      {!showText && (
        <div className="absolute left-full ml-4 px-2.5 py-1 bg-surface border border-surface-border rounded-md opacity-0 group-hover:opacity-100 pointer-events-none text-sm z-50 transition-opacity whitespace-nowrap shadow-xl">
          {label}
        </div>
      )}
    </>
  );

  const baseClasses = cn(
    "group relative flex items-center px-4 py-3 rounded-lg transition-all hover-lift overflow-visible",
    effectiveCollapsed ? "justify-center px-3" : "space-x-3",
    !showIcon && showText && "justify-center text-center",
    danger 
      ? "text-destructive/70 hover:bg-destructive/10 hover:text-destructive" 
      : isActive 
        ? "bg-primary/10 text-primary" 
        : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={logout} className={cn(baseClasses, "w-full")}>
      {content}
    </button>
  );
};


export function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const { buttonStyle } = useUI();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Read collapse state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem("sidebarCollapsed", (!isCollapsed).toString());
  };

  const effectiveCollapsed = isCollapsed || buttonStyle === "ICON";



  return (
    <aside className={cn(
      "border-r border-surface-border bg-surface hidden md:flex flex-col transition-all duration-300 relative",
      effectiveCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("h-20 flex items-center border-b border-surface-border overflow-hidden transition-all duration-300", effectiveCollapsed ? "justify-center px-0" : "px-8")}>
        <h1 className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap text-xl">
          {effectiveCollapsed ? "SC" : "SmartCompute"}
        </h1>
      </div>
      
      {buttonStyle !== "ICON" && (
        <button 
          onClick={toggleCollapse}
          className="absolute -right-3 top-24 bg-surface border border-surface-border rounded-full p-1 text-foreground/50 hover:text-foreground shadow-sm hover:shadow-md transition-all z-10"
        >
          {effectiveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
      
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden">
        <SidebarItem pathname={pathname} effectiveCollapsed={effectiveCollapsed} buttonStyle={buttonStyle} logout={logout} href="/" icon={LayoutDashboard} label="Dashboard" />
        <SidebarItem pathname={pathname} effectiveCollapsed={effectiveCollapsed} buttonStyle={buttonStyle} logout={logout} href="/budget-sheet" icon={Wallet} label="Budget Sheet" />
        <SidebarItem pathname={pathname} effectiveCollapsed={effectiveCollapsed} buttonStyle={buttonStyle} logout={logout} href="/categories" icon={Tags} label="Categories" />
        <SidebarItem pathname={pathname} effectiveCollapsed={effectiveCollapsed} buttonStyle={buttonStyle} logout={logout} href="/statuses" icon={ListChecks} label="Statuses" />
        <SidebarItem pathname={pathname} effectiveCollapsed={effectiveCollapsed} buttonStyle={buttonStyle} logout={logout} href="/automations" icon={Zap} label="Automations" />
      </nav>

      <div className="p-4 border-t border-surface-border space-y-2">
        <SidebarItem pathname={pathname} effectiveCollapsed={effectiveCollapsed} buttonStyle={buttonStyle} logout={logout} href="/settings" icon={Settings} label="Settings" />
        <SidebarItem pathname={pathname} effectiveCollapsed={effectiveCollapsed} buttonStyle={buttonStyle} logout={logout} icon={LogOut} label="Logout" danger />
      </div>
    </aside>
  );
}
