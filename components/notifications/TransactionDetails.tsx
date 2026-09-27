"use client";

type EventKey = "funded" | "shipped" | "delivered" | "disputed" | "completed";

/** Sample transaction detail card shown inside the email body. */
export function TransactionDetails({ eventKey }: { eventKey: EventKey }) {
  return (
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
  );
}
