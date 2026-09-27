"use client";

/** Disclaimer footer rendered at the bottom of the email preview. */
export function EmailFooter() {
  return (
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
        You are receiving this email because you have notification preferences
        enabled for escrow events.
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
  );
}
