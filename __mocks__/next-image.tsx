import React, { forwardRef } from "react";

type MockImageProps = React.ComponentPropsWithoutRef<"img"> & {
  unoptimized?: boolean;
  priority?: boolean;
  fill?: boolean;
  placeholder?: string;
  blurDataURL?: string;
};

const Image = forwardRef<HTMLImageElement, MockImageProps>(
  ({ unoptimized, priority, fill, placeholder, blurDataURL, ...props }, ref) => {
    void [unoptimized, priority, fill, placeholder, blurDataURL];
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img ref={ref} {...props} />;
  }
);

Image.displayName = "Image";

export default Image;
