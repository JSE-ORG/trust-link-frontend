"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-muted-bg p-1 shadow-sm">
      <button
        onClick={() => setTheme("light")}
        className={`rounded-full p-1.5 transition-colors ${
          theme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`rounded-full p-1.5 transition-colors ${
          theme === "system"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
        aria-label="System mode"
      >
        <Monitor className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`rounded-full p-1.5 transition-colors ${
          theme === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
