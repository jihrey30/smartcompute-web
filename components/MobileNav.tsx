'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tags, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/budget-sheet', icon: Wallet, label: 'Budget' },
    { href: '/categories', icon: Tags, label: 'Categories' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-background/80 backdrop-blur-xl z-50 px-6 py-2 pb-safe">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300 relative py-1",
                isActive ? "text-primary scale-110" : "text-foreground/50 hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-300",
                isActive ? "bg-primary/20 shadow-inner text-primary" : ""
              )}>
                <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5]" : "")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold transition-all", 
                isActive ? "opacity-100" : "opacity-0 h-0"
              )}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
