import { ArrowLeft, Bell, CheckCheck, Search } from "lucide-react";

interface NotificationsToolbarProps {
  /** Current unread notification count. */
  unreadCount: number;
  /** Navigates to the previous page. */
  onBack: () => void;
  /** Marks all notifications as read. */
  onMarkAllAsRead: () => void;
}

/** Renders the notifications heading, navigation, and bulk action. */
export function NotificationsToolbar({
  unreadCount,
  onBack,
  onMarkAllAsRead,
}: NotificationsToolbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={onMarkAllAsRead}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </button>
      )}
    </div>
  );
}

interface NotificationsSearchProps {
  /** Current search input value. */
  value: string;
  /** Updates the search query. */
  onChange: (value: string) => void;
}

/** Renders the notification search field. */
export function NotificationsSearch({ value, onChange }: NotificationsSearchProps) {
  return (
    <div className="mb-4">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search notifications..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white dark:focus-visible:ring-zinc-300"
          data-testid="notifications-search"
        />
      </div>
    </div>
  );
}