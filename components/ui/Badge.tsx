import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-foreground text-background hover:opacity-80",
    secondary: "border-transparent bg-muted-bg text-foreground hover:opacity-80",
    destructive: "border-transparent bg-destructive text-white hover:opacity-80",
    outline: "text-foreground border-border",
    success: "border-transparent bg-success text-white hover:opacity-80",
    warning: "border-transparent bg-warning text-white hover:opacity-80",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
