import type { Meta, StoryObj } from "@storybook/react";
import TransactionHistoryExport from "./TransactionHistoryExport";
import type { Escrow } from "@/types";

const meta = {
  title: "Dashboard/TransactionHistoryExport",
  component: TransactionHistoryExport,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TransactionHistoryExport>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEscrows: Escrow[] = [
  {
    id: "escrow-1",
    vendorId: "vendor-123",
    buyerId: "buyer-abcdef1234567890",
    item: "Laptop",
    amount: 1200,
    status: "COMPLETED",
    contractAddress: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:00:00Z",
    history: [],
  },
  {
    id: "escrow-2",
    vendorId: "vendor-123",
    buyerId: "buyer-xyz9876543210abc",
    item: "Phone",
    amount: 800,
    status: "SHIPPED",
    contractAddress: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    createdAt: "2024-01-16T11:00:00Z",
    updatedAt: "2024-01-18T15:30:00Z",
    history: [],
  },
  {
    id: "escrow-3",
    vendorId: "vendor-123",
    buyerId: "buyer-test1111111111",
    item: "Headphones",
    amount: 150,
    status: "PENDING",
    contractAddress: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    createdAt: "2024-01-17T09:00:00Z",
    updatedAt: "2024-01-17T09:00:00Z",
    history: [],
  },
  {
    id: "escrow-4",
    vendorId: "vendor-123",
    buyerId: "buyer-disputed22222",
    item: "Tablet",
    amount: 500,
    status: "DISPUTED",
    contractAddress: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    createdAt: "2024-01-18T14:00:00Z",
    updatedAt: "2024-01-19T10:00:00Z",
    history: [],
  },
];

export const WithMultipleTransactions: Story = {
  args: {
    escrows: mockEscrows,
    vendorId: "vendor-123",
  },
};

export const WithSingleTransaction: Story = {
  args: {
    escrows: [mockEscrows[0]],
    vendorId: "vendor-123",
  },
};

export const Empty: Story = {
  args: {
    escrows: [],
    vendorId: "vendor-123",
  },
};

export const WithLargeDataset: Story = {
  args: {
    escrows: [
      ...mockEscrows,
      ...mockEscrows.map((e, i) => ({
        ...e,
        id: `${e.id}-copy-${i}`,
        amount: e.amount + Math.random() * 500,
      })),
    ],
    vendorId: "vendor-123",
  },
};
