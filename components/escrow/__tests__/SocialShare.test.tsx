import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { track } from "@/lib/analytics";

import EscrowLinkShareButtons from "../EscrowLinkShareButtons";
import ShareModal from "../ShareModal";

vi.mock("@/components/ui/QrCode", () => ({ QrCode: () => null }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn().mockResolvedValue(undefined) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const url = "https://trustlink.example.com/pay/1293";
const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

function renderButtons() {
  return render(
    <EscrowLinkShareButtons
      url={url}
      title="Escrow Agreement 1293"
      amount={12450}
      escrowId="1293"
      isCopying={false}
      copyStatus="idle"
      errorMsg={null}
      onCopy={vi.fn()}
      onNativeShare={vi.fn()}
      qrRef={{ current: null }}
    />
  );
}

describe.each([
  {
    name: "card WhatsApp",
    renderShare: renderButtons,
    button: "Share on WhatsApp",
    platform: "whatsapp",
    fallback: "whatsapp_app",
  },
  {
    name: "card Instagram",
    renderShare: renderButtons,
    button: "Share on Instagram",
    platform: "instagram",
    fallback: "clipboard",
  },
  {
    name: "modal WhatsApp",
    renderShare: () => render(<ShareModal isOpen onClose={vi.fn()} url={url} />),
    button: "WhatsApp",
    platform: "whatsapp",
    fallback: "share_modal",
  },
])("$name sharing", ({ renderShare, button, platform, fallback }) => {
  const share = vi.fn();
  const writeText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    share.mockReset().mockResolvedValue(undefined);
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "open").mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [key, descriptor] of [
      ["share", originalShare],
      ["clipboard", originalClipboard],
    ] as const) {
      if (descriptor) Object.defineProperty(navigator, key, descriptor);
      else Reflect.deleteProperty(navigator, key);
    }
  });

  async function clickShare() {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderShare();
    await user.click(screen.getByRole("button", { name: button }));
  }

  function expectFallback() {
    if (platform === "instagram") {
      expect(writeText).toHaveBeenCalledExactlyOnceWith(
        `Secure payment link via TrustLink: ${url}\n\nCopy and paste in your bio or story!`
      );
      expect(window.open).not.toHaveBeenCalled();
    } else {
      expect(window.open).toHaveBeenCalledExactlyOnceWith(
        `whatsapp://send?text=${encodeURIComponent(`Pay for your order securely using TrustLink: ${url}`)}`,
        "_blank"
      );
      expect(writeText).not.toHaveBeenCalled();
    }
    expect(vi.mocked(track).mock.calls.filter(([event]) => event === "link_shared"))
      .toEqual([["link_shared", { platform, method: fallback }]]);
  }

  it("records exactly one native success without invoking the fallback", async () => {
    await clickShare();

    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url }));
    expect(window.open).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    expect(vi.mocked(track).mock.calls.filter(([event]) => event === "link_shared"))
      .toEqual([["link_shared", { platform, method: "native" }]]);
  });

  it.each([
    new DOMException("Canceled", "AbortError"),
    Object.assign(new Error("Canceled"), { name: "AbortError" }),
  ])("silently respects native cancellation (%s)", async (error) => {
    share.mockRejectedValue(error);
    await clickShare();

    expect(share).toHaveBeenCalledTimes(1);
    expect(window.open).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(vi.mocked(track).mock.calls.filter(([event]) => event === "link_shared"))
      .toEqual([]);
  });

  it("uses the fallback after a genuine share failure", async () => {
    share.mockRejectedValue(new Error("Share unavailable"));
    await clickShare();

    expect(share).toHaveBeenCalledTimes(1);
    expectFallback();
  });

  it("uses the fallback when native sharing is unsupported", async () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    await clickShare();

    expect(share).not.toHaveBeenCalled();
    expectFallback();
  });
});
