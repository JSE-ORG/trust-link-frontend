import React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

export interface EmptyVendorStateProps {
  title?: string;
  description?: string;
}

export default function EmptyVendorState({
  title = "No escrows yet",
  description = "Create your first escrow payment link to begin receiving secure payments.",
}: EmptyVendorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white px-4 py-16 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900">
        <Inbox className="h-10 w-10 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
      </div>
      
      <h2 className="mb-2 text-xl font-semibold text-zinc-950 dark:text-zinc-100">
        {title}
      </h2>
      
      <p className="mb-8 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      
      <Link
        href="/create"
        className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-300"
      >
        Create Your First Link
      </Link>
    </div>
  );
}
