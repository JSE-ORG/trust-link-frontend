"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProGateProps {
  feature: string;
  description?: string;
  children?: React.ReactNode;
  /** "overlay" blurs children behind the gate; "block" replaces them entirely */
  variant?: "overlay" | "block";
}

export default function ProGate({
  feature,
  description,
  children,
  variant = "block",
}: ProGateProps) {
  const { isPro, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div
        className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-zinc-950"
        role="status"
        aria-live="polite"
        aria-label={`Loading ${feature}`}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="w-full space-y-2">
            <Skeleton className="mx-auto h-5 w-2/3" />
            <Skeleton className="mx-auto h-4 w-full" />
            <Skeleton className="mx-auto h-4 w-4/5" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>
    );
  }
  if (isPro) return <>{children}</>;

  const gate = (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-12 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
        <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
      </span>
      <div>
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {feature} is a Pro feature
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description ?? "Upgrade to Pro to unlock this and all other Pro features."}
        </p>
      </div>
      <Link
        href="/pricing"
        className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
      >
        <Sparkles className="h-4 w-4" />
        Upgrade to Pro
      </Link>
    </div>
  );

  if (variant === "overlay" && children) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {gate}
        </div>
      </div>
    );
  }

  return gate;
}
