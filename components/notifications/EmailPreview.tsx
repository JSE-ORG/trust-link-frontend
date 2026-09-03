"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EventKey = "funded" | "shipped" | "delivered" | "disputed" | "completed";

interface EmailPreviewProps {
  eventKey: EventKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_CONTENT: Record<
  EventKey,
  { subject: string; heading: string; body: string; footer: string }
> = {
  funded: {
    subject: "Escrow Funded – TrustLink",
    heading: "Your escrow has been funded",
    body: "A buyer has successfully funded an escrow transaction. The funds are now securely held in TrustLink until you fulfill the order.",
    footer: "Once you ship the item, the buyer will be notified. You can track this transaction from your TrustLink dashboard.",
  },
  shipped: {
    subject: "Item Shipped – TrustLink",
    heading: "The item has been shipped",
    body: "The seller has shipped the item for an escrow transaction. Tracking information has been shared with the buyer.",
    footer: "Once the buyer confirms delivery, the escrow will move to the next step. You can track this transaction from your TrustLink dashboard.",
  },
  delivered: {
    subject: "Item Delivered – TrustLink",
    heading: "The item has been delivered",
    body: "The item in an escrow transaction has been marked as delivered. The buyer can now inspect the item and confirm satisfaction.",
    footer: "Once the buyer confirms delivery, funds will be released to the seller. You can track this transaction from your TrustLink dashboard.",
  },
  disputed: {
    subject: "Dispute Opened – TrustLink",
    heading: "A dispute has been opened",
    body: "A dispute has been raised for an escrow transaction. Both parties will need to provide evidence to resolve the issue.",
    footer: "Our team will review the case and work toward a fair resolution. You can track this transaction from your TrustLink dashboard.",
  },
  completed: {
    subject: "Escrow Completed – TrustLink",
    heading: "Escrow transaction completed",
    body: "The escrow transaction has been successfully completed. Funds have been released to the seller.",
    footer: "Thank you for using TrustLink. You can view your transaction history from your dashboard.",
  },
};

export default function EmailPreview({
  eventKey,
  open,
  onOpenChange,
}: EmailPreviewProps) {
  const content = EMAIL_CONTENT[eventKey];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-6 py-4">
          <div
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              backgroundColor: "#f6f6f6",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Email header with branding */}
            <div
              style={{
                backgroundColor: "#1B2A6B",
                padding: "24px 32px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  lineHeight: 1,
                }}
              >
                TrustLink
              </div>
              <div
                style={{
                  color: "#8DA0FF",
                  fontSize: "12px",
                  marginTop: "4px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Secure Escrow Transactions
              </div>
            </div>

            {/* Email body */}
            <div style={{ backgroundColor: "#ffffff", padding: "32px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginTop: 0,
                  marginBottom: "16px",
                }}
              >
                {content.heading}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#555555",
                  lineHeight: 1.6,
                  marginTop: 0,
                  marginBottom: "16px",
                }}
              >
                {content.body}
              </p>

              {/* Sample transaction card */}
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888888",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Transaction Details
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    color: "#333333",
                    marginBottom: "4px",
                  }}
                >
                  <span>Escrow ID</span>
                  <span style={{ fontFamily: "monospace" }}>#TL-2026-0847</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    color: "#333333",
                    marginBottom: "4px",
                  }}
                >
                  <span>Amount</span>
                  <span style={{ fontWeight: 600 }}>$1,250.00</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    color: "#333333",
                  }}
                >
                  <span>Status</span>
                  <span
                    style={{
                      backgroundColor: "#e8f5e9",
                      color: "#2e7d32",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {eventKey}
                  </span>
                </div>
              </div>

              <p
                style={{
                  fontSize: "14px",
                  color: "#555555",
                  lineHeight: 1.6,
                  marginTop: 0,
                  marginBottom: "24px",
                }}
              >
                {content.footer}
              </p>

              <div style={{ textAlign: "center" }}>
                <a
                  href="#"
                  style={{
                    display: "inline-block",
                    backgroundColor: "#1B2A6B",
                    color: "#ffffff",
                    padding: "12px 32px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  View in Dashboard
                </a>
              </div>
            </div>

            {/* Email footer */}
            <div
              style={{
                backgroundColor: "#f6f6f6",
                padding: "24px 32px",
                borderTop: "1px solid #e5e5e5",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#999999",
                  textAlign: "center",
                  marginTop: 0,
                  marginBottom: "8px",
                }}
              >
                You are receiving this email because you have notification
                preferences enabled for escrow events.
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999999",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                TrustLink &mdash; Secure Escrow Platform
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
