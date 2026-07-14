import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import PaymentForm, { PaymentFormProps } from './PaymentForm';

const baseProps: PaymentFormProps = {
  escrowId: 'test_escrow_id',
  itemName: 'Test Item',
  amount: 10,
  protocolFee: 1,
  total: 11,
  sellerAddress: 'GDC...seller',
  escrowContractId: 'GDC...contract',
  status: 'PENDING',
  onPaymentSuccess: fn(),
};

const meta: Meta<typeof PaymentForm> = {
  title: 'components/payment/PaymentForm',
  component: PaymentForm,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof PaymentForm>;

export const Default: Story = {
  args: { ...baseProps },
};

export const WalletDisconnected: Story = {
  args: { ...baseProps },
};

export const Loading: Story = {
  args: { ...baseProps },
};

export const Success: Story = {
  args: { ...baseProps },
};

export const Error: Story = {
  args: { ...baseProps },
};

export const EscrowNotPayable: Story = {
  args: { ...baseProps, status: 'COMPLETED' },
};

export const LargeAmount: Story = {
  args: { ...baseProps, amount: 1000000, total: 1000001, protocolFee: 1 },
};
