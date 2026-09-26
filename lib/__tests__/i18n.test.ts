import { describe, expect, it } from "vitest";

import i18n from "../i18n";

describe("i18n Configuration", () => {
  it("initializes with default locale 'en' and supports 'fr'", async () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.languages).toContain("en");
    expect(i18n.t("payment.title", { lng: "en" })).toBe("Payment");
    expect(i18n.t("payment.title", { lng: "fr" })).toBe("Paiement");
  });

  it("returns correct English translations for payment flow", () => {
    expect(i18n.t("payment.title", { lng: "en" })).toBe("Payment");
    expect(i18n.t("payment.item", { lng: "en" })).toBe("Item");
    expect(i18n.t("payment.total", { lng: "en" })).toBe("Total");
    expect(i18n.t("payment.sendReceipt", { lng: "en" })).toBe("Send me a receipt");
    expect(i18n.t("payment.emailReceipt", { lng: "en" })).toBe("Email address for receipt");
  });

  it("returns correct French translations for payment flow", () => {
    expect(i18n.t("payment.title", { lng: "fr" })).toBe("Paiement");
    expect(i18n.t("payment.item", { lng: "fr" })).toBe("Article");
    expect(i18n.t("payment.total", { lng: "fr" })).toBe("Total");
    expect(i18n.t("payment.sendReceipt", { lng: "fr" })).toBe("M'envoyer un reçu");
    expect(i18n.t("payment.emailReceipt", { lng: "fr" })).toBe("Adresse e-mail pour le reçu");
    expect(i18n.t("payment.payNow", { lng: "fr" })).toBe("Payer maintenant");
    expect(i18n.t("payment.submitting", { lng: "fr" })).toBe("Traitement en cours...");
  });
});
