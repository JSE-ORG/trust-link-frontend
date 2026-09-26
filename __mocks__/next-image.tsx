import React, { forwardRef } from "react";

const Image = forwardRef<HTMLImageElement, any>(({ unoptimized, priority, fill, placeholder, blurDataURL, ...props }, ref) => {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img ref={ref} {...props} />;
});

Image.displayName = "Image";

export default Image;
