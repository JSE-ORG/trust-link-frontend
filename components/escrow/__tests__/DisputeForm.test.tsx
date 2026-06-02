// src/escrow/__test__/DisputeForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import DisputeForm from '../DisputeForm';

// Mock fetch for API calls
vi.spyOn(global, 'fetch');

// Helper to fill an input by its label text
function fillField(labelPattern: RegExp, value: string) {
  const input = screen.getByLabelText(labelPattern);
  fireEvent.change(input, { target: { value } });
}

// Helper to set files on a file input (jsdom doesn't support DataTransfer everywhere)
function setFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', {
    value: files,
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
}

// Helper to navigate to step 3 (evidence upload)
async function navigateToStep3() {
  fillField(/name/i, 'John Doe');
  fillField(/email/i, 'john@example.com');
  fillField(/order number/i, 'ORD-123');
  fireEvent.click(screen.getByTestId('next-button'));

  fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'product_not_received' } });
  fillField(/description/i, 'This is a detailed description of the dispute with enough characters.');
  fireEvent.click(screen.getByTestId('next-button'));
}

describe('DisputeForm Multi-Step Flow', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
    vi.mocked(fetch).mockReset();
  });

  describe('Navigation Tests', () => {
    test('navigates forward through all steps', async () => {
      render(<DisputeForm />);

      // Step 1: Fill personal info
      expect(screen.getByTestId('step-1')).toBeInTheDocument();
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');

      // Click next to step 2
      fireEvent.click(screen.getByTestId('next-button'));
      expect(screen.getByTestId('step-2')).toBeInTheDocument();

      // Fill step 2 and go to step 3
      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'product_not_received' } });
      fillField(/description/i, 'This is a detailed description of the dispute with enough characters.');
      fireEvent.click(screen.getByTestId('next-button'));
      expect(screen.getByTestId('step-3')).toBeInTheDocument();
    });

    test('navigates backward through steps', async () => {
      render(<DisputeForm />);

      // Fill step 1 fully to pass validation
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');
      fireEvent.click(screen.getByTestId('next-button'));
      expect(screen.getByTestId('step-2')).toBeInTheDocument();

      // Go back to step 1
      fireEvent.click(screen.getByTestId('back-button'));
      expect(screen.getByTestId('step-1')).toBeInTheDocument();
    });
  });

  describe('Step 2 Validation Tests', () => {
    test('blocks proceed when reason is empty (AC #2)', async () => {
      render(<DisputeForm />);

      // Navigate to step 2
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');
      fireEvent.click(screen.getByTestId('next-button'));

      // Try to proceed without selecting a reason
      fireEvent.click(screen.getByTestId('next-button'));

      // Should show error message
      expect(screen.getByText(/reason is required/i)).toBeInTheDocument();
      // Should still be on step 2
      expect(screen.getByTestId('step-2')).toBeInTheDocument();
    });

    test('allows proceed when reason is provided', async () => {
      render(<DisputeForm />);

      // Navigate to step 2
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');
      fireEvent.click(screen.getByTestId('next-button'));

      // Select reason and add description
      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'product_not_received' } });
      fillField(/description/i, 'This is a detailed description with enough characters for validation.');

      // Proceed to step 3
      fireEvent.click(screen.getByTestId('next-button'));
      expect(screen.getByTestId('step-3')).toBeInTheDocument();
    });
  });

  describe('File Upload Validation Tests', () => {
    test('rejects files with invalid types', async () => {
      render(<DisputeForm />);
      await navigateToStep3();

      // Try to upload a .txt file (invalid type)
      const invalidFile = new File(['test content'], 'notes.txt', { type: 'text/plain' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      setFiles(fileInput, [invalidFile]);

      // Invalid file should NOT appear in the file list
      expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
    });

    test('rejects files exceeding the 5MB size limit', async () => {
      render(<DisputeForm />);
      await navigateToStep3();

      // Create a file that exceeds 5MB
      const oversizedFile = new File(
        ['x'.repeat(6 * 1024 * 1024)],
        'huge.pdf',
        { type: 'application/pdf' }
      );
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      setFiles(fileInput, [oversizedFile]);

      // Oversized file should NOT appear in the file list
      expect(screen.queryByText('huge.pdf')).not.toBeInTheDocument();
    });

    test('accepts valid file types (JPEG, PNG, PDF)', async () => {
      render(<DisputeForm />);
      await navigateToStep3();

      const jpegFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['img'], 'screenshot.png', { type: 'image/png' });
      const pdfFile = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' });

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;

      // Upload JPEG
      setFiles(fileInput, [jpegFile]);
      expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();

      // Upload PNG (appended to existing files)
      setFiles(fileInput, [jpegFile, pngFile]);
      expect(screen.getByText(/screenshot\.png/)).toBeInTheDocument();

      // Upload PDF
      setFiles(fileInput, [jpegFile, pngFile, pdfFile]);
      expect(screen.getByText(/receipt\.pdf/)).toBeInTheDocument();
    });

    test('adds files and shows them in review step', async () => {
      render(<DisputeForm />);
      await navigateToStep3();

      // Upload file
      const mockFile = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      setFiles(fileInput, [mockFile]);

      // Check file appears in list (text includes size like "evidence.pdf (0.0 KB)")
      expect(screen.getByText(/evidence\.pdf/)).toBeInTheDocument();

      // Go to review step
      fireEvent.click(screen.getByTestId('next-button'));

      // File should appear in review section
      expect(screen.getByTestId('review-section')).toBeInTheDocument();
      expect(screen.getByText(/evidence\.pdf/)).toBeInTheDocument();
    });

    test('removes file when delete button is clicked', async () => {
      render(<DisputeForm />);
      await navigateToStep3();

      // Upload file
      const mockFile = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      setFiles(fileInput, [mockFile]);
      expect(screen.getByText(/evidence\.pdf/)).toBeInTheDocument();

      // Delete the file
      fireEvent.click(screen.getByTestId('delete-file-0'));

      // File should be removed
      expect(screen.queryByText(/evidence\.pdf/)).not.toBeInTheDocument();
    });

    test('blocks proceeding to step 4 when no files are uploaded', async () => {
      render(<DisputeForm />);
      await navigateToStep3();

      // Try to proceed without uploading files
      fireEvent.click(screen.getByTestId('next-button'));

      // Should show validation error
      expect(screen.getByText(/please upload at least one file/i)).toBeInTheDocument();
      // Should still be on step 3
      expect(screen.getByTestId('step-3')).toBeInTheDocument();
    });
  });

  describe('Submit Tests', () => {
    test('calls POST /dispute with correct payload (AC #4)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: '123' }),
      } as Response);

      render(<DisputeForm />);

      // Step 1
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');
      fireEvent.click(screen.getByTestId('next-button'));

      // Step 2
      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'product_not_received' } });
      fillField(/description/i, 'This is a detailed description with enough characters for validation.');
      fireEvent.click(screen.getByTestId('next-button'));

      // Step 3
      const mockFile = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      setFiles(fileInput, [mockFile]);
      fireEvent.click(screen.getByTestId('next-button'));

      // Step 4 - Agree to terms and submit
      fireEvent.click(screen.getByLabelText(/i confirm/i));
      fireEvent.click(screen.getByTestId('submit-button'));

      // Verify API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/dispute', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }));
      });

      // Verify payload content
      const callArgs = vi.mocked(fetch).mock.calls[0][1];
      const payload = JSON.parse(callArgs!.body as string);
      expect(payload).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        orderNumber: 'ORD-123',
        reason: 'product_not_received',
      });
    });

    test('shows success state after successful submit (AC #5)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, disputeId: 'DIS-123' }),
      } as Response);

      render(<DisputeForm />);

      // Complete form submission
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');
      fireEvent.click(screen.getByTestId('next-button'));

      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'product_not_received' } });
      fillField(/description/i, 'This is a detailed description with enough characters.');
      fireEvent.click(screen.getByTestId('next-button'));

      const mockFile = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });
      setFiles(screen.getByTestId('file-input') as HTMLInputElement, [mockFile]);
      fireEvent.click(screen.getByTestId('next-button'));

      fireEvent.click(screen.getByLabelText(/i confirm/i));
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('success-state')).toBeInTheDocument();
        expect(screen.getByText(/dispute submitted successfully/i)).toBeInTheDocument();
      });
    });

    test('shows error state when API call fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      render(<DisputeForm />);

      // Complete form submission
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');
      fireEvent.click(screen.getByTestId('next-button'));

      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'product_not_received' } });
      fillField(/description/i, 'This is a detailed description with enough characters.');
      fireEvent.click(screen.getByTestId('next-button'));

      const mockFile = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });
      setFiles(screen.getByTestId('file-input') as HTMLInputElement, [mockFile]);
      fireEvent.click(screen.getByTestId('next-button'));

      fireEvent.click(screen.getByLabelText(/i confirm/i));
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('persists form data when navigating back and forth', async () => {
      render(<DisputeForm />);

      // Fill step 1 fully
      fillField(/name/i, 'Jane Smith');
      fillField(/email/i, 'jane@example.com');
      fillField(/order number/i, 'ORD-456');

      // Go to step 2
      fireEvent.click(screen.getByTestId('next-button'));
      expect(screen.getByTestId('step-2')).toBeInTheDocument();

      // Go back to step 1
      fireEvent.click(screen.getByTestId('back-button'));

      // Data should still be there
      expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Smith');
    });

    test('prevents submission while API call is in progress', async () => {
      // Mock slow response
      vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<DisputeForm />);

      // Complete form
      fillField(/name/i, 'John Doe');
      fillField(/email/i, 'john@example.com');
      fillField(/order number/i, 'ORD-123');
      fireEvent.click(screen.getByTestId('next-button'));

      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'product_not_received' } });
      fillField(/description/i, 'This is a detailed description with enough characters.');
      fireEvent.click(screen.getByTestId('next-button'));

      const mockFile = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });
      setFiles(screen.getByTestId('file-input') as HTMLInputElement, [mockFile]);
      fireEvent.click(screen.getByTestId('next-button'));

      fireEvent.click(screen.getByLabelText(/i confirm/i));

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });
  });
});
