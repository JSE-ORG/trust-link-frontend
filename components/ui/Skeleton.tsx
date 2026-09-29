import type { HTMLAttributes } from "react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  "data-testid"?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, "data-testid": testId = "skeleton", ...props }, ref) => (
    <div
      ref={ref}
      data-testid={testId}
      className={cn(
        "animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-700/70",
        className
      )}
      {...props}
    />
  )
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
