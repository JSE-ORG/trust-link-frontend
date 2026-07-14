"use client";

import Image, { type ImageProps } from "next/image";
import { sanitizeUrl } from "@/lib/sanitize";

interface OptimizedImageProps extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
  /**
   * Whether to use blur placeholder while loading.
   * @default true
   */
  useBlur?: boolean;
  /**
   * Custom blur data URL. If not provided, uses a default gray placeholder.
   */
  customBlurDataURL?: string;
}

/**
 * Optimized image component with lazy loading and blur placeholder.
 * Reduces layout shift and improves perceived performance.
 *
 * Pass `priority` to mark an image as the LCP candidate — this disables lazy
 * loading automatically so the browser fetches the image as early as possible.
 */
export default function OptimizedImage({
  useBlur = true,
  customBlurDataURL,
  loading,
  priority,
  alt,
  src,
  ...props
}: OptimizedImageProps) {
  // Guard against `javascript:`/`vbscript:` URLs reaching the underlying <img>.
  // String sources are sanitised; static imports (objects) are passed through.
  const safeSrc = typeof src === "string" ? sanitizeUrl(src) : src;

  const blurDataURL =
    customBlurDataURL ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='1 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Cg filter='url(%23b)'%3E%3Crect fill='%23f4f4f5' width='400' height='300'/%3E%3C/g%3E%3C/svg%3E";

  // When `priority` is set, Next.js Image treats the image as eager/preloaded.
  // Explicitly passing loading="lazy" would conflict, so we only set loading
  // when it hasn't been provided AND priority is not set.
  const resolvedLoading = loading ?? (priority ? undefined : "lazy");

  return (
    <Image
      {...props}
      src={safeSrc}
      alt={alt}
      loading={resolvedLoading}
      priority={priority}
      placeholder={useBlur ? "blur" : "empty"}
      blurDataURL={useBlur ? blurDataURL : undefined}
    />
  );
}
