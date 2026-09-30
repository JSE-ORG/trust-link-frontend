"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EmailBody } from "./EmailBody";
import { EmailFooter } from "./EmailFooter";
import { EmailHeader } from "./EmailHeader";

type EventKey = "funded" | "shipped" | "delivered" | "disputed" | "completed";

/** Props for the EmailPreview dialog component. */
interface EmailPreviewProps {
  /** The escrow event type used to select email content. */
  eventKey: EventKey;
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** Callback invoked when the dialog open state should change. */
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

/** Dialog that previews how an escrow-event email will look to the recipient. */
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
            <EmailHeader />
            <EmailBody
              heading={content.heading}
              body={content.body}
              footer={content.footer}
              eventKey={eventKey}
            />
            <EmailFooter />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
