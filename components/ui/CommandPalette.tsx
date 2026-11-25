/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  AlertCircle,
  BarChart3,
  Bell,
  Home,
  PlusCircle,
  Search,
  Truck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import FocusTrap from "./FocusTrap";

export type Command = {
  label: string;
  route: string;
  description?: string;
  icon: React.ReactNode;
};

export const COMMANDS: Command[] = [
  {
    label: "Dashboard",
    route: "/dashboard",
    description: "Go to vendor dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: "Analytics",
    route: "/dashboard/analytics",
    description: "View vendor performance analytics",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Create Escrow",
    route: "/create",
    description: "Start a new escrow transaction",
    icon: <PlusCircle className="h-5 w-5" />,
  },
  {
    label: "Profile",
    route: "/profile",
    description: "View your profile",
    icon: <User className="h-5 w-5" />,
  },
  {
    label: "Tracking",
    route: "/tracking",
    description: "Track your shipments",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    label: "Dispute Guide",
    route: "/docs",
    description: "Learn how dispute resolution works",
    icon: <AlertCircle className="h-5 w-5" />,
  },
  {
    label: "Notifications",
    route: "/notifications",
    description: "View your notifications",
    icon: <Bell className="h-5 w-5" />,
  },
];

function filterCommands(query: string) {
  const needle = query.toLowerCase();
  return COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(needle) ||
      (cmd.description && cmd.description.toLowerCase().includes(needle))
  );
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const titleId = useId();

  // Toggle Command Palette with keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Start every open (and close) from a clean list.
        setSearch("");
        setActiveIndex(0);
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredCommands = filterCommands(search);

  // Typing changes the filtered results, so point the active index at the
  // first match (or at nothing when there is none).
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setActiveIndex(filterCommands(value).length > 0 ? 0 : -1);
  };

  // Scroll active item into view when activeIndex changes
  useEffect(() => {
    if (activeIndex >= 0) {
      const activeEl = document.getElementById(`command-item-${activeIndex}`);
      if (typeof activeEl?.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  // Body scroll lock while the palette is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (route: string) => {
    setIsOpen(false);
    router.push(route);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCommands.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
      );
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(filteredCommands.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filteredCommands[activeIndex]) {
        handleSelect(filteredCommands[activeIndex].route);
      }
    }
  };

  const activeOptionId =
    activeIndex >= 0 && filteredCommands[activeIndex]
      ? `command-item-${activeIndex}`
      : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <FocusTrap
        active={isOpen}
        onEscape={() => setIsOpen(false)}
        initialFocusRef={inputRef}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 dark:border dark:border-zinc-800 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="sr-only">
            Command palette
          </h2>

          {/* Search Input */}
          <div className="flex items-center border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500 mr-3 shrink-0" />
            <input
              ref={inputRef}
              id="command-palette-search"
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
              aria-label="Search commands"
              className="flex-1 bg-transparent text-lg text-zinc-900 placeholder-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:text-white dark:placeholder-zinc-500 dark:focus-visible:ring-zinc-300 rounded"
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <kbd className="hidden sm:inline-block rounded bg-zinc-100 px-2 py-1 text-xs font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ml-3 shrink-0">
              ESC
            </kbd>
          </div>

          {/* Command Listbox */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            <div id={listboxId} role="listbox" aria-label="Commands">
              {filteredCommands.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div
                    role="presentation"
                    className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    Navigation
                  </div>
                  {filteredCommands.map((cmd, index) => {
                    const isSelected = activeIndex === index;
                    return (
                      <div
                        key={cmd.route}
                        id={`command-item-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(cmd.route)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition cursor-pointer select-none ${
                          isSelected
                            ? "bg-zinc-100 dark:bg-zinc-800/80 ring-2 ring-zinc-950 dark:ring-zinc-300"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className="text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg">
                          {cmd.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {cmd.label}
                          </span>
                          {cmd.description && (
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              {cmd.description}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {filteredCommands.length === 0 && (
              <p
                role="status"
                aria-live="polite"
                className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400"
              >
                No results found.
              </p>
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
