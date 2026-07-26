import React from "react";
import { useUI } from "./UIProvider";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "primary" | "danger" | "ghost";
}

export function ActionButton({ icon: Icon, label, variant = "default", className, ...props }: ActionButtonProps) {
  const { buttonStyle } = useUI();
  
  const showIcon = buttonStyle === "ICON" || buttonStyle === "BOTH";
  const showText = buttonStyle === "TEXT" || buttonStyle === "BOTH";

  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md";
  
  // Style sizing based on content
  const sizeStyles = showText && showIcon ? "px-3 py-1.5 text-sm space-x-1.5" 
                   : showText ? "px-4 py-1.5 text-sm" 
                   : "p-2"; // Icon only is square
                   
  const variants = {
    default: "bg-surface-border text-foreground hover:bg-primary hover:text-white",
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20",
    ghost: "bg-transparent text-foreground/70 hover:bg-surface-hover hover:text-foreground"
  };

  return (
    <button 
      className={cn(baseStyles, sizeStyles, variants[variant], className)}
      title={buttonStyle === "ICON" ? label : undefined}
      {...props}
    >
      {showIcon && <Icon className={cn("shrink-0", showText ? "w-3.5 h-3.5" : "w-4 h-4")} />}
      {showText && <span>{label}</span>}
    </button>
  );
}
