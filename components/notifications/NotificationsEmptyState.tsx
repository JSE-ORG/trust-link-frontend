import { Bell } from "lucide-react";
import Link from "next/link";

/** Displays the empty state for an account with no notifications. */
export function NotificationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
      <Bell className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
      <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">No notifications yet</p>
      <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Escrow events will appear here.</p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

interface NotificationsSearchEmptyStateProps {
  /** Clears the active search query. */
  onClear: () => void;
}

/** Displays the empty state when search filters out every notification. */
export function NotificationsSearchEmptyState({
  onClear,
}: NotificationsSearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No notifications match your search.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 text-sm font-medium text-black hover:underline dark:text-white"
      >
        Clear search
      </button>
    </div>
  );
}