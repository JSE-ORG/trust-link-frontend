import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QrCode } from "@/components/ui/QrCode";
import { createEscrow } from "@/lib/api";
import { downloadQrCode } from "@/lib/utils/downloadQrCode";

import EscrowCreateForm from "./EscrowCreateForm";
import EscrowLinkShareButtons from "./EscrowLinkShareButtons";

vi.mock("@/lib/utils/downloadQrCode", () => ({ downloadQrCode: vi.fn() }));
vi.mock("@/lib/api", () => ({ createEscrow: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn().mockResolvedValue(undefined) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./ShareModal", () => ({ default: () => null }));

const urls = ["https://trustlink.test/pay/first?amount=25", "https://trustlink.test/pay/second?memo=buyer%20two"];

function ShareButtons({ url }: { url: string }) {
  const qrRef = useRef<HTMLDivElement>(null);
  return <>
    <div ref={qrRef}><QrCode value={url} /></div>
    <EscrowLinkShareButtons
      url={url} title="Camera" amount={25} escrowId="camera" isCopying={false}
      copyStatus="idle" errorMsg={null} onCopy={() => {}} onNativeShare={() => {}} qrRef={qrRef}
    />
  </>;
}

describe("QR download actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(downloadQrCode).mockResolvedValue(undefined);
  });

  it("downloads the currently displayed sharing QR after the URL changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ShareButtons url={urls[0]} />);
    for (const url of urls) {
      rerender(<ShareButtons url={url} />);
      const svg = await screen.findByRole("img", { name: `QR code for ${url}` });
      await user.click(screen.getByRole("button", { name: "Download QR" }));
      expect(downloadQrCode).toHaveBeenLastCalledWith(svg, "escrow_camera.png");
    }
    expect(toast.success).toHaveBeenCalledTimes(2);
  });

  it("downloads the creation result's QR after each successful submission", async () => {
    const user = userEvent.setup();
    render(<EscrowCreateForm initialValues={{ itemName: "Camera", priceUSDC: "25", description: "A working camera" }} />);
    for (const url of urls) {
      vi.mocked(createEscrow).mockResolvedValueOnce({ url });
      await user.click(screen.getByRole("button", { name: /create escrow link/i }));
      await waitFor(() => expect(screen.getByTestId("shareable-url")).toHaveValue(url));
      const svg = screen.getByRole("img", { name: `QR code for ${url}` });
      await user.click(screen.getByRole("button", { name: "Download QR" }));
      expect(downloadQrCode).toHaveBeenLastCalledWith(svg, "escrow-qr.png");
    }
    expect(toast.success).toHaveBeenCalledTimes(2);
  });

  it.each(["sharing", "creation"])("reports %s download failures without success feedback", async (surface) => {
    const user = userEvent.setup();
    vi.mocked(downloadQrCode).mockRejectedValueOnce(new Error("Encoding failed"));
    if (surface === "sharing") render(<ShareButtons url={urls[0]} />);
    else {
      vi.mocked(createEscrow).mockResolvedValueOnce({ url: urls[0] });
      render(<EscrowCreateForm initialValues={{ itemName: "Camera", priceUSDC: "25", description: "A working camera" }} />);
      await user.click(screen.getByRole("button", { name: /create escrow link/i }));
      await screen.findByTestId("link-card");
    }
    await user.click(screen.getByRole("button", { name: "Download QR" }));
    expect(toast.error).toHaveBeenCalledWith("Could not download QR code. Please try again.");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
