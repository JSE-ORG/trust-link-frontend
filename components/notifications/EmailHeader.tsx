"use client";

/** Branded header rendered at the top of the email preview. */
export function EmailHeader() {
  return (
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
  );
}
