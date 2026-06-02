"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, PlusCircle, User, Truck, AlertCircle, Bell } from "lucide-react";

type Command = {
  label: string;
  route: string;
  description?: string;
  icon: React.ReactNode;
};

const COMMANDS: Command[] = [
  { label: "Dashboard", route: "/dashboard", description: "Go to vendor dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Create Escrow", route: "/create", description: "Start a new escrow transaction", icon: <PlusCircle className="h-5 w-5" /> },
  { label: "Profile", route: "/profile", description: "View your profile", icon: <User className="h-5 w-5" /> },
  { label: "Tracking", route: "/track", description: "Track your shipments", icon: <Truck className="h-5 w-5" /> },
  { label: "Disputes", route: "/dispute", description: "Manage disputes", icon: <AlertCircle className="h-5 w-5" /> },
  { label: "Notifications", route: "/notifications", description: "View your notifications", icon: <Bell className="h-5 w-5" /> },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on Escape and focus input on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "auto";
      setSearch("");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    (cmd.description && cmd.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (route: string) => {
    setIsOpen(false);
    router.push(route);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 dark:border dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-zinc-900 placeholder-zinc-400 outline-none dark:text-white dark:placeholder-zinc-500"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="hidden sm:inline-block rounded bg-zinc-100 px-2 py-1 text-xs font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ml-3 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <p className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No results found.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <h3 className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Navigation
              </h3>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.route}
                  onClick={() => handleSelect(cmd.route)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
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
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
