import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadQrCode } from "./downloadQrCode";

describe("downloadQrCode", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  const context = { fillRect: vi.fn(), drawImage: vi.fn(), imageSmoothingEnabled: true, fillStyle: "" };
  let imageFails = false;
  let svg: SVGSVGElement;

  beforeEach(() => {
    vi.useFakeTimers();
    imageFails = false;
    createObjectURL.mockReset().mockReturnValueOnce("blob:svg").mockReturnValueOnce("blob:png");
    revokeObjectURL.mockReset();
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    });
    vi.stubGlobal("Image", class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        // Synchronously deliver the browser event after handlers are attached.
        if (imageFails) this.onerror?.();
        else this.onload?.();
      }
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["png-data"], { type: "image/png" }));
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 37 37");
    Object.defineProperty(svg, "viewBox", { value: { baseVal: { width: 37 } } });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("paints the rendered SVG before encoding, downloads a PNG, and releases URLs", async () => {
    const click = vi.mocked(HTMLAnchorElement.prototype.click);
    await downloadQrCode(svg, "escrow_order.png");

    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 518, 518);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(context.drawImage.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(HTMLCanvasElement.prototype.toBlob).mock.invocationCallOrder[0]
    );
    expect(click).toHaveBeenCalledOnce();
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("escrow_order.png");
    expect(link.href).toBe("blob:png");
    expect(link.isConnected).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:svg");
    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:png");
  });

  it("rejects an unavailable QR without starting a download", async () => {
    await expect(downloadQrCode(null, "qr.png")).rejects.toThrow("not ready");
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it("reports image loading failure and releases the source URL", async () => {
    imageFails = true;
    await expect(downloadQrCode(svg, "qr.png")).rejects.toThrow("could not be loaded");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:svg");
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it("rejects a missing canvas context", async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    await expect(downloadQrCode(svg, "qr.png")).rejects.toThrow("unavailable");
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it("does not download when PNG encoding returns null", async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => callback(null));
    await expect(downloadQrCode(svg, "qr.png")).rejects.toThrow("could not be encoded");
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:svg");
  });

  it("does not download when PNG encoding returns an empty blob", async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => callback(new Blob([])));
    await expect(downloadQrCode(svg, "qr.png")).rejects.toThrow("could not be encoded");
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:svg");
  });

  it("propagates download errors and still releases both URLs", async () => {
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(() => { throw new Error("Download blocked"); });
    await expect(downloadQrCode(svg, "qr.png")).rejects.toThrow("Download blocked");
    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:svg");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:png");
  });
});
