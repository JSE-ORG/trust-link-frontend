"use client";

import Image, { type ImageProps } from "next/image";

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
 */
export default function OptimizedImage({
  useBlur = true,
  customBlurDataURL,
  loading = "lazy",
  alt,
  ...props
}: OptimizedImageProps) {
  const blurDataURL =
    customBlurDataURL ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='1 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Cg filter='url(%23b)'%3E%3Crect fill='%23f4f4f5' width='400' height='300'/%3E%3C/g%3E%3C/svg%3E";

  return (
    <Image
      {...props}
      alt={alt}
      loading={loading}
      placeholder={useBlur ? "blur" : "empty"}
      blurDataURL={useBlur ? blurDataURL : undefined}
    />
  );
}
