"use client";

import { TransactionDetails } from "./TransactionDetails";

type EventKey = "funded" | "shipped" | "delivered" | "disputed" | "completed";

/** Main body section containing heading, copy, transaction card, and CTA. */
export function EmailBody({
  heading,
  body,
  footer,
  eventKey,
}: {
  heading: string;
  body: string;
  footer: string;
  eventKey: EventKey;
}) {
  return (
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
        {heading}
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
        {body}
      </p>

      <TransactionDetails eventKey={eventKey} />

      <p
        style={{
          fontSize: "14px",
          color: "#555555",
          lineHeight: 1.6,
          marginTop: 0,
          marginBottom: "24px",
        }}
      >
        {footer}
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
  );
}
