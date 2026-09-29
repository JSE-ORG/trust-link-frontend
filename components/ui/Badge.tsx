import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:focus:ring-zinc-300";
  
  const variants = {
    default: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80",
    secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
    destructive: "border-transparent bg-red-500 text-zinc-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/80",
    outline: "text-zinc-950 dark:text-zinc-50",
    success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80 dark:bg-emerald-900 dark:text-white dark:hover:bg-emerald-900/80",
    warning: "border-transparent bg-amber-500 text-white hover:bg-amber-500/80 dark:bg-amber-900 dark:text-white dark:hover:bg-amber-900/80",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
