import React from 'react';
import PaymentForm, { PaymentFormProps } from './PaymentForm';
import * as paymentFormModule from './PaymentForm';
import { useWallet } from '@/hooks/useWallet';
import { signTransaction } from '@/lib/stellar/freighter';
import { getStellarExpertUrl } from '@/lib/explorer';
import { vi } from 'vitest';

// Mock the external modules
vi.mock('@/hooks/useWallet');
vi.mock('@/lib/stellar/freighter');
vi.mock('@/lib/explorer');

// Helper to create props
const baseProps: PaymentFormProps = {
  escrowId: 'test_escrow_id',
  itemName: 'Test Item',
  amount: 10,
  protocolFee: 1,
  total: 11,
  sellerAddress: 'GDC...seller',
  escrowContractId: 'GDC...contract',
  status: 'PENDING',
  onPaymentSuccess: (hash: string) => {
    console.log('Payment success:', hash);
  },
};

// Reset mocks before each story
export const decorators = [
  (Story: React.FC) => {
    vi.resetAllMocks();
    return <Story />;
  },
];

export default {
  title: 'components/payment/PaymentForm',
  component: PaymentForm,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: { ...baseProps },
};

export const WalletDisconnected = {
  args: { ...baseProps },
  // Mock useWallet to return disconnected status
  parameters: {
    // We'll set the mock implementation in the story function
  },
  // We can also use the play function to set up mocks
  play: async ({ args }) => {
    (useWallet as jest.Mock).mockReturnValue({ status: 'disconnected' });
  },
};

export const Loading = {
  args: { ...baseProps },
  play: async ({ args }) => {
    // Mock signTransaction to resolve
    (signTransaction as jest.Mock).mockResolvedValue('signed_xdr_mock');
    // Mock the internal mock functions to delay to show loading
    // We'll make mockFetchTransactionXdr resolve after a delay
    paymentFormModule.mockFetchTransactionXdr.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('mock_xdr'), 100))
    );
    paymentFormModule.mockSubmitTransaction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('mock_tx_hash'), 100))
    );
  },
};

export const Success = {
  args: { ...baseProps },
  play: async ({ args }) => {
    // Mock signTransaction to resolve
    (signTransaction as jest.Mock).mockResolvedValue('signed_xdr_mock');
    // Mock the internal mock functions to resolve successfully
    paymentFormModule.mockFetchTransactionXdr.mockResolvedValue('mock_xdr');
    paymentFormModule.mockSubmitTransaction.mockResolvedValue('mock_tx_hash');
  },
};

export const Error = {
  args: { ...baseProps },
  play: async ({ args }) => {
    // Mock signTransaction to resolve
    (signTransaction as jest.Mock).mockResolvedValue('signed_xdr_mock');
    // Mock the internal mock functions to reject
    paymentFormModule.mockFetchTransactionXdr.mockResolvedValue('mock_xdr');
    paymentFormModule.mockSubmitTransaction.mockRejectedValue(new Error('Network error'));
  },
};

export const EscrowNotPayable = {
  args: { ...baseProps, status: 'COMPLETED' },
};

export const LargeAmount = {
  args: { ...baseProps, amount: 1000000, total: 1000001, protocolFee: 1 },
};

export const SmallAmount = {
  args: { ...baseProps, amount: 0.0001, protocolFee: 0, total: 0.0001 },
};