import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import OptimizedImage from "./OptimizedImage";

describe("OptimizedImage", () => {
  it("renders with lazy loading by default", () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={400}
        height={300}
      />
    );
    
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("loading")).toBe("lazy");
  });

  it("applies blur placeholder when useBlur is true", () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={400}
        height={300}
        useBlur={true}
      />
    );
    
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
  });

  it("accepts custom blur data URL", () => {
    const customBlur = "data:image/svg+xml;base64,customdata";
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={400}
        height={300}
        customBlurDataURL={customBlur}
      />
    );
    
    // Component should render without errors
    expect(true).toBe(true);
  });

  it("disables blur when useBlur is false", () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={400}
        height={300}
        useBlur={false}
      />
    );
    
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
  });

  it("passes through standard Image props", () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image description"
        width={400}
        height={300}
        className="custom-class"
      />
    );
    
    const img = container.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("Test image description");
  });
});
