import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import EscrowLinkCard from '../EscrowLinkCard';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, "aria-label": ariaLabel }: { value: string; "aria-label"?: string }) => (
    <svg data-testid="qr-code" data-value={value} aria-label={ariaLabel} />
  ),
}));

const mockUrl = 'https://trustlink.example.com/pay/1293';

async function renderAndWait(ui: React.ReactElement) {
  const result = render(ui);
  await waitFor(() => {
    expect(screen.getByTestId('escrow-link')).toBeInTheDocument();
  }, { timeout: 2000 });
  return result;
}

describe('EscrowLinkCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    test('renders skeleton placeholders when loading', () => {
      const { container } = render(<EscrowLinkCard loading={true} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Copy to Clipboard Tests (AC #1)', () => {
    test('copy button writes URL to clipboard when clicked', async () => {
      await renderAndWait(<EscrowLinkCard />);

      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUrl);
    });

    test('shows success feedback when copy succeeds', async () => {
      await renderAndWait(<EscrowLinkCard />);

      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/link copied/i)).toBeInTheDocument();
      });
    });

    test('shows error feedback when copy fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
        },
      });

      await renderAndWait(<EscrowLinkCard />);

      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/clipboard error/i)).toBeInTheDocument();
      });
    });

    test('calls onCopySuccess callback when copy succeeds', async () => {
      const onCopySuccess = vi.fn();
      await renderAndWait(<EscrowLinkCard onCopySuccess={onCopySuccess} />);

      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(onCopySuccess).toHaveBeenCalledTimes(1);
      });
    });

    test('calls onCopyError callback when copy fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
        },
      });

      const onCopyError = vi.fn();
      await renderAndWait(<EscrowLinkCard onCopyError={onCopyError} />);

      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(onCopyError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('QR Code Tests (AC #2)', () => {
    test('QR code renders with correct URL as value', async () => {
      await renderAndWait(<EscrowLinkCard />);

      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toBeInTheDocument();
      expect(qrCode).toHaveAttribute('data-value', mockUrl);
    });

    test('QR code has aria-label', async () => {
      await renderAndWait(<EscrowLinkCard />);

      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toHaveAttribute('aria-label', expect.stringContaining('QR'));
    });
  });

  describe('WhatsApp Share Tests (AC #3)', () => {
    test('WhatsApp button opens correct URL', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await renderAndWait(<EscrowLinkCard />);

      const waButton = screen.getByRole('button', { name: /share on whatsapp/i });
      await userEvent.click(waButton);

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('whatsapp://send?text='),
        '_blank'
      );
      expect(openSpy.mock.calls[0][0]).toContain(encodeURIComponent(mockUrl));

      openSpy.mockRestore();
    });
  });

  describe('Share buttons', () => {
    test('Instagram share button is rendered', async () => {
      await renderAndWait(<EscrowLinkCard />);
      expect(screen.getByRole('button', { name: /share on instagram/i })).toBeInTheDocument();
    });

    test('Twitter/X copy button is rendered', async () => {
      await renderAndWait(<EscrowLinkCard />);
      expect(screen.getByRole('button', { name: /copy for twitter/i })).toBeInTheDocument();
    });

    test('QR download button is rendered', async () => {
      await renderAndWait(<EscrowLinkCard />);
      expect(screen.getByRole('button', { name: /download qr/i })).toBeInTheDocument();
    });
  });

  describe('Link Content Tests (AC #4)', () => {
    test('displays escrow ID and URL', async () => {
      await renderAndWait(<EscrowLinkCard />);

      expect(screen.getByText(/escrow id: 1293/i)).toBeInTheDocument();

      const linkElement = screen.getByTestId('escrow-link') as HTMLInputElement;
      expect(linkElement.value).toContain(mockUrl);
    });

    test('displays escrow title', async () => {
      await renderAndWait(<EscrowLinkCard />);
      expect(screen.getByText(/escrow agreement 1293/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('copy button has accessible label', async () => {
      await renderAndWait(<EscrowLinkCard />);
      expect(screen.getByRole('button', { name: /copy url/i })).toBeInTheDocument();
    });

    test('WhatsApp button has accessible label', async () => {
      await renderAndWait(<EscrowLinkCard />);
      expect(screen.getByRole('button', { name: /share on whatsapp/i })).toBeInTheDocument();
    });
  });

  describe('Card States', () => {
    test('renders nothing until the link has loaded', () => {
      const { container } = render(<EscrowLinkCard />);
      // fetchEscrowLink is still pending on the first synchronous render.
      expect(container).toBeEmptyDOMElement();
    });

    test('renders the loaded escrow summary (status, amount, id)', async () => {
      await renderAndWait(<EscrowLinkCard />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('12,450.00 USDC')).toBeInTheDocument();
      expect(screen.getByText(/escrow id: 1293/i)).toBeInTheDocument();
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });
  });

  describe('Copy edge cases', () => {
    test('shows an error message when the Clipboard API is unavailable', async () => {
      Object.assign(navigator, { clipboard: undefined });

      await renderAndWait(<EscrowLinkCard />);
      await userEvent.click(screen.getByRole('button', { name: /copy url/i }));

      const errorNode = await screen.findByTestId('copy-error');
      expect(errorNode).toHaveTextContent(/not supported/i);
      expect(screen.queryByTestId('copy-success')).not.toBeInTheDocument();
    });

    test('ignores a second click while a copy is already in flight', async () => {
      let resolveWrite: (() => void) | undefined;
      const writeText = vi.fn(
        () => new Promise<void>((resolve) => { resolveWrite = () => resolve(); })
      );
      Object.assign(navigator, { clipboard: { writeText } });

      await renderAndWait(<EscrowLinkCard />);
      const copyButton = screen.getByRole('button', { name: /copy url/i });

      await userEvent.click(copyButton);
      await userEvent.click(copyButton);

      expect(writeText).toHaveBeenCalledTimes(1);

      resolveWrite?.();
      await waitFor(() => {
        expect(screen.getByTestId('copy-success')).toBeInTheDocument();
      });
    });
  });

  describe('Native share integration', () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'share');
    });

    test('WhatsApp uses the Web Share API when available and skips the app fallback', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share });
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await renderAndWait(<EscrowLinkCard />);
      await userEvent.click(screen.getByRole('button', { name: /share on whatsapp/i }));

      await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
      expect(share.mock.calls[0][0]).toMatchObject({ url: mockUrl });
      expect(openSpy).not.toHaveBeenCalled();

      openSpy.mockRestore();
    });

    test('renders native share button and calls navigator.share with title, text, and url when supported', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share });

      await renderAndWait(<EscrowLinkCard />);
      const shareBtn = screen.getByRole('button', { name: /native share/i });
      expect(shareBtn).toBeInTheDocument();

      await userEvent.click(shareBtn);
      await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
      expect(share).toHaveBeenCalledWith({
        title: 'Escrow Agreement 1293',
        text: expect.stringContaining('Pay for your order securely using TrustLink: https://trustlink.example.com/pay/1293'),
        url: mockUrl,
      });
    });

    test('falls back to copy link button when navigator.share is unsupported', async () => {
      Object.assign(navigator, { share: undefined });

      await renderAndWait(<EscrowLinkCard />);
      expect(screen.queryByRole('button', { name: /native share/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy url/i })).toBeInTheDocument();
    });

    test('Instagram falls back to copying the share text when Web Share is unavailable', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText }, share: undefined });

      await renderAndWait(<EscrowLinkCard />);
      await userEvent.click(screen.getByRole('button', { name: /share on instagram/i }));

      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
      expect(writeText.mock.calls[0][0]).toContain(mockUrl);
    });

      test('renders status badges under PENDING, FUNDED, SHIPPED, and COMPLETED states', async () => {
    // This loops through all requested statuses and checks if they render on screen
    const statuses = ["PENDING", "FUNDED", "SHIPPED", "COMPLETED"];
    for (const status of statuses) {
      const { unmount } = await renderAndAwait(<EscrowLinkCard />);
      expect(screen.getByText(new RegExp(status, "i"))).toBeInTheDocument();
      unmount();
    }
  });

  test('triggers the clipboard copy API when the copy url button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText }, share: undefined });

    await renderAndAwait(<EscrowLinkCard />);
    const copyButton = screen.getByRole('button', { name: /copy url/i });
    expect(copyButton).toBeInTheDocument();
    
    await userEvent.click(copyButton);
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  });

  });
});

