/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Monitor,Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const themeOrder: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const themeLabels: Record<Theme, string> = {
  light: "Switch to dark mode",
  dark: "Switch to system theme",
  system: "Switch to light mode",
};

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
    );
  }

  const currentTheme = (resolvedTheme === "dark" ? "dark" : "light") as Theme;

  const cycleTheme = () => {
    setTheme(themeOrder[currentTheme]);
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={themeLabels[currentTheme]}
      className="flex items-center justify-center w-8 h-8 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-300"
    >
      {currentTheme === "dark" ? (
        <Sun size={15} />
      ) : currentTheme === "light" ? (
        <Moon size={15} />
      ) : (
        <Monitor size={15} />
      )}
    </button>
  );
}
