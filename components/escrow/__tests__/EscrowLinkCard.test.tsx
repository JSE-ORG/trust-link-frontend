// src/escrow/__test__/EscrowLinkCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import EscrowLinkCard from '../EscrowLinkCard';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock QR code library
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, "aria-label": ariaLabel }: { value: string; "aria-label"?: string }) => (
    <svg data-testid="qr-code" data-value={value} aria-label={ariaLabel} />
  ),
}));

// Mock window.location
const mockUrl = 'https://trustlink.example.com/escrow/ESC-123-456';

describe('EscrowLinkCard Component', () => {
  const defaultProps = {
    escrowId: 'ESC-123-456',
    url: mockUrl,
    onCopySuccess: vi.fn(),
    onCopyError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Copy to Clipboard Tests (AC #1)', () => {
    test('copy button writes URL to clipboard when clicked', async () => {
      (navigator.clipboard.writeText as any).mockResolvedValueOnce(undefined);
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await userEvent.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUrl);
    });

    test('shows success feedback when copy succeeds', async () => {
      (navigator.clipboard.writeText as any).mockResolvedValueOnce(undefined);
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/link copied/i)).toBeInTheDocument();
      });
    });

    test('shows error feedback when copy fails', async () => {
      (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Clipboard error/i)).toBeInTheDocument();
      });
    });

    test('calls onCopySuccess callback when copy succeeds', async () => {
      (navigator.clipboard.writeText as any).mockResolvedValueOnce(undefined);
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await userEvent.click(copyButton);
      
      expect(defaultProps.onCopySuccess).toHaveBeenCalledTimes(1);
      expect(defaultProps.onCopyError).not.toHaveBeenCalled();
    });

    test('calls onCopyError callback when copy fails', async () => {
      (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(defaultProps.onCopyError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('QR Code Tests (AC #2)', () => {
    test('QR code renders with correct URL as value', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toBeInTheDocument();
      expect(qrCode).toHaveAttribute('data-value', mockUrl);
    });

    test('QR code updates when URL changes', () => {
      const { rerender } = render(<EscrowLinkCard {...defaultProps} />);
      
      const newUrl = 'https://trustlink.example.com/escrow/ESC-999-888';
      rerender(<EscrowLinkCard {...defaultProps} url={newUrl} />);
      
      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toHaveAttribute('data-value', newUrl);
    });

    test('QR code is not rendered when showQRCode prop is false', () => {
      render(<EscrowLinkCard {...defaultProps} showQRCode={false} />);
      
      expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
    });
  });

  describe('WhatsApp Link Tests (AC #3)', () => {
    test('WhatsApp link is correctly encoded with URL', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const whatsappLink = screen.getByTestId('whatsapp-link');
      
      expect(whatsappLink).toBeInTheDocument();
      
      const href = whatsappLink.getAttribute('href');
      expect(href).toContain('https://wa.me/?text=');
      expect(href).toContain(encodeURIComponent(mockUrl));
    });

    test('WhatsApp link includes custom message when provided', () => {
      const customMessage = 'Check out my escrow transaction!';
      render(<EscrowLinkCard {...defaultProps} whatsappMessage={customMessage} />);
      
      const whatsappLink = screen.getByTestId('whatsapp-link');
      
      const href = whatsappLink.getAttribute('href');
      expect(href).toContain(encodeURIComponent(customMessage));
      expect(href).toContain(encodeURIComponent(mockUrl));
    });

    test('WhatsApp link opens in new tab', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const whatsappLink = screen.getByTestId('whatsapp-link');
      
      expect(whatsappLink).toHaveAttribute('target', '_blank');
      expect(whatsappLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    test('WhatsApp button is not rendered when showWhatsApp prop is false', () => {
      render(<EscrowLinkCard {...defaultProps} showWhatsApp={false} />);
      
      expect(screen.queryByTestId('whatsapp-link')).not.toBeInTheDocument();
    });
  });

  describe('Link Content Tests (AC #4)', () => {
    test('link contains correct escrow ID', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      // Check if the escrow ID is displayed
      expect(screen.getByText(/Escrow ID: ESC-123-456/i)).toBeInTheDocument();
      
      // Check if the input contains the URL
      const linkElement = screen.getByTestId('escrow-link') as HTMLInputElement;
      expect(linkElement.value).toContain(mockUrl);
    });

    test('displays the full URL', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      // The URL should be visible in the input
      expect(screen.getByDisplayValue(mockUrl)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing clipboard API gracefully', async () => {
      // Mock missing clipboard API
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: null },
        configurable: true,
      });
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/clipboard not supported/i)).toBeInTheDocument();
      });
      
      // Restore
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });
    });

    test('disables copy button while copying', async () => {
      (navigator.clipboard.writeText as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await userEvent.click(copyButton);
      
      expect(copyButton).toBeDisabled();
      
      await waitFor(() => {
        expect(copyButton).not.toBeDisabled();
      });
    });

    test('renders without optional props', () => {
      render(<EscrowLinkCard escrowId="ESC-123" url={mockUrl} />);
      
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('copy button has accessible label', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy link/i });
      expect(copyButton).toBeInTheDocument();
    });

    test('WhatsApp link has accessible label', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const whatsappLink = screen.getByRole('link', { name: /share on whatsapp/i });
      expect(whatsappLink).toBeInTheDocument();
    });

    test('QR code has alt text or aria-label', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toHaveAttribute('aria-label', expect.stringContaining('QR'));
    });
  });
});
