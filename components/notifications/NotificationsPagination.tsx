interface NotificationsPaginationProps {
  /** Current page after clamping against live data. */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Changes the requested page. */
  onPageChange: (page: number) => void;
}

/** Renders pagination controls when notifications span multiple pages. */
export function NotificationsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: NotificationsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Showing page <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentPage}</span> of{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}