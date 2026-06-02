# Lazy Loading and Blur Placeholders for Escrow Images

## Overview

This feature implements optimized image loading for escrow item images using Next.js Image component with:

- **Lazy loading**: Images load only when they enter the viewport
- **Blur placeholders**: Smooth visual transition while images load
- **Reduced layout shift**: Proper dimensions prevent content jumping
- **Faster page renders**: Initial page load is not blocked by image loading

## Components

### OptimizedImage Component

Location: `components/ui/OptimizedImage.tsx`

A reusable wrapper around Next.js Image that provides:

- Automatic lazy loading by default
- Built-in blur placeholder with SVG-based fallback
- Custom blur data URL support
- Full Next.js Image API compatibility

#### Usage

```tsx
import OptimizedImage from "@/components/ui/OptimizedImage";

// Basic usage
<OptimizedImage
  src="/product.jpg"
  alt="Product image"
  width={600}
  height={400}
/>

// With custom blur
<OptimizedImage
  src="/product.jpg"
  alt="Product image"
  width={600}
  height={400}
  customBlurDataURL="data:image/svg+xml,..."
/>

// Disable blur
<OptimizedImage
  src="/product.jpg"
  alt="Product image"
  width={600}
  height={400}
  useBlur={false}
/>
```

#### Props

- `src`: Image source URL (required)
- `alt`: Alternative text (required)
- `width`: Image width in pixels (required)
- `height`: Image height in pixels (required)
- `useBlur`: Enable/disable blur placeholder (default: true)
- `customBlurDataURL`: Custom blur data URL (optional)
- `loading`: "lazy" or "eager" (default: "lazy")
- All other Next.js Image props are supported

## Implementation Details

### Escrow Type Updates

Added `imageUrl` field to the `Escrow` interface in `types/index.ts`:

```typescript
export interface Escrow {
  // ... existing fields
  imageUrl?: string; // Optional escrow item image
}
```

### Components Using OptimizedImage

1. **EscrowLinkCard** (`components/escrow/EscrowLinkCard.tsx`)
   - Displays full-width escrow item image when available
   - Dimensions: 600x400px
   - Responsive sizing with `sizes` attribute

2. **VendorDashboardList** (`components/dashboard/VendorDashboardList.tsx`)
   - Shows thumbnail in escrow list items
   - Dimensions: 80x80px
   - Fixed size for consistent layout

### Next.js Image Configuration

Updated `next.config.ts` to allow images from common hosting services:

- S3 buckets (all regions)
- Unsplash (for testing/demos)
- Cloudinary
- Imgix

## Performance Benefits

### Lazy Loading

- Images only load when scrolling into viewport
- Reduces initial page load time
- Saves bandwidth for users who don't scroll to all images

### Blur Placeholder

- Prevents empty space during image load
- Smooth visual transition
- Improves perceived performance
- Uses lightweight SVG placeholder (< 1KB)

### Layout Shift Prevention

- Proper width/height attributes prevent content jumping
- Improves Core Web Vitals (CLS - Cumulative Layout Shift)
- Better user experience

## Testing

Run the test suite:

```bash
npm test components/ui/OptimizedImage.test.tsx
```

View in Storybook:

```bash
npm run storybook
```

Navigate to "UI/OptimizedImage" to see all variations.

## Browser Support

- Modern browsers with native lazy loading support
- Falls back gracefully in older browsers
- Next.js Image component handles optimization automatically

## Future Enhancements

- [ ] Generate blur data URLs from actual images at build time
- [ ] Add image compression and format optimization (WebP, AVIF)
- [ ] Implement responsive image sizes for different viewports
- [ ] Add loading skeleton for better visual feedback
- [ ] Support for multiple image variants (thumbnail, full-size)

## Related Files

- `components/ui/OptimizedImage.tsx` - Main component
- `components/ui/OptimizedImage.test.tsx` - Unit tests
- `components/ui/OptimizedImage.stories.tsx` - Storybook stories
- `components/escrow/EscrowLinkCard.tsx` - Implementation example
- `components/dashboard/VendorDashboardList.tsx` - Implementation example
- `types/index.ts` - Type definitions
- `next.config.ts` - Image configuration
