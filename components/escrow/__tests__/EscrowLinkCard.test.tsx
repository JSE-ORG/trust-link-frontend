// src/escrow/__test__/EscrowLinkCard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EscrowLinkCard from '../EscrowLinkCard';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock QR code library (if used)
jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-code" data-value={value} />
  ),
}));

// Mock window.location
const mockUrl = 'https://trustlink.example.com/escrow/ESC-123-456';

describe('EscrowLinkCard Component', () => {
  const defaultProps = {
    escrowId: 'ESC-123-456',
    url: mockUrl,
    onCopySuccess: jest.fn(),
    onCopyError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Copy to Clipboard Tests (AC #1)', () => {
    test('copy button writes URL to clipboard when clicked', async () => {
      navigator.clipboard.writeText.mockResolvedValueOnce(undefined);
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
      await userEvent.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUrl);
    });

    test('shows success feedback when copy succeeds', async () => {
      navigator.clipboard.writeText.mockResolvedValueOnce(undefined);
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/copied|link copied/i)).toBeInTheDocument();
      });
    });

    test('shows error feedback when copy fails', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to copy|error/i)).toBeInTheDocument();
      });
    });

    test('calls onCopySuccess callback when copy succeeds', async () => {
      navigator.clipboard.writeText.mockResolvedValueOnce(undefined);
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
      await userEvent.click(copyButton);
      
      expect(defaultProps.onCopySuccess).toHaveBeenCalledTimes(1);
      expect(defaultProps.onCopyError).not.toHaveBeenCalled();
    });

    test('calls onCopyError callback when copy fails', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
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
      
      const whatsappLink = screen.getByTestId('whatsapp-link') || 
                           screen.getByRole('link', { name: /whatsapp|share/i });
      
      expect(whatsappLink).toBeInTheDocument();
      
      const href = whatsappLink.getAttribute('href');
      expect(href).toContain('https://wa.me/?text=');
      expect(href).toContain(encodeURIComponent(mockUrl));
    });

    test('WhatsApp link includes custom message when provided', () => {
      const customMessage = 'Check out my escrow transaction!';
      render(<EscrowLinkCard {...defaultProps} whatsappMessage={customMessage} />);
      
      const whatsappLink = screen.getByTestId('whatsapp-link') || 
                           screen.getByRole('link', { name: /whatsapp|share/i });
      
      const href = whatsappLink.getAttribute('href');
      expect(href).toContain(encodeURIComponent(customMessage));
      expect(href).toContain(encodeURIComponent(mockUrl));
    });

    test('WhatsApp link opens in new tab', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const whatsappLink = screen.getByTestId('whatsapp-link') || 
                           screen.getByRole('link', { name: /whatsapp|share/i });
      
      expect(whatsappLink).toHaveAttribute('target', '_blank');
      expect(whatsappLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    test('WhatsApp button is not rendered when showWhatsApp prop is false', () => {
      render(<EscrowLinkCard {...defaultProps} showWhatsApp={false} />);
      
      expect(screen.queryByTestId('whatsapp-link')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /whatsapp|share/i })).not.toBeInTheDocument();
    });
  });

  describe('Link Content Tests (AC #4)', () => {
    test('link contains correct escrow ID', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      // Check if the escrow ID is displayed somewhere
      expect(screen.getByText(/ESC-123-456/i)).toBeInTheDocument();
      
      // Check if the URL contains the escrow ID
      const linkElement = screen.getByTestId('escrow-link') || 
                          screen.getByRole('link', { name: /escrow|link/i });
      
      if (linkElement) {
        const href = linkElement.getAttribute('href');
        expect(href).toContain(defaultProps.escrowId);
      }
    });

    test('displays the full URL or truncated version', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      // The URL should be visible somewhere
      expect(screen.getByText(new RegExp(mockUrl, 'i'))).toBeInTheDocument();
    });

    test('shows different escrow ID when prop changes', () => {
      const { rerender } = render(<EscrowLinkCard {...defaultProps} />);
      
      expect(screen.getByText(/ESC-123-456/i)).toBeInTheDocument();
      
      const newEscrowId = 'ESC-999-888';
      rerender(<EscrowLinkCard {...defaultProps} escrowId={newEscrowId} url={`https://trustlink.example.com/escrow/${newEscrowId}`} />);
      
      expect(screen.getByText(new RegExp(newEscrowId, 'i'))).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing clipboard API gracefully', async () => {
      // Remove clipboard API
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
      await userEvent.click(copyButton);
      
      // Should show error or fallback message
      await waitFor(() => {
        expect(screen.getByText(/clipboard not supported|copy manually/i)).toBeInTheDocument();
      });
      
      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });
    });

    test('handles very long escrow IDs', () => {
      const longEscrowId = 'ESC-' + '1234567890'.repeat(10);
      const longUrl = `https://trustlink.example.com/escrow/${longEscrowId}`;
      
      render(<EscrowLinkCard escrowId={longEscrowId} url={longUrl} />);
      
      expect(screen.getByText(new RegExp(longEscrowId.slice(0, 20), 'i'))).toBeInTheDocument();
    });

    test('disables copy button while copying', async () => {
      navigator.clipboard.writeText.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
      await userEvent.click(copyButton);
      
      // Button should be disabled during copy
      expect(copyButton).toBeDisabled();
      
      await waitFor(() => {
        expect(copyButton).not.toBeDisabled();
      });
    });

    test('renders without optional props', () => {
      render(<EscrowLinkCard escrowId="ESC-123" url={mockUrl} />);
      
      expect(screen.getByRole('button', { name: /copy|copy link/i })).toBeInTheDocument();
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('copy button has accessible label', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy|copy link/i });
      expect(copyButton).toHaveAccessibleName();
    });

    test('WhatsApp link has accessible label', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const whatsappLink = screen.getByRole('link', { name: /whatsapp|share/i });
      expect(whatsappLink).toHaveAccessibleName();
    });

    test('QR code has alt text or aria-label', () => {
      render(<EscrowLinkCard {...defaultProps} />);
      
      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toHaveAttribute('aria-label', expect.stringContaining('QR'));
    });
  });
});