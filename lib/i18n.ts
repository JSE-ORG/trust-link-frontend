/**
 * Internationalisation (i18n) configuration for TrustLink.
 *
 * Uses i18next together with `react-i18next` to provide translated strings
 * throughout the app. The instance is initialised lazily (guarded by
 * `i18n.isInitialized`) so it is safe to import this module in both the
 * browser and Node.js (e.g. during tests or SSR).
 *
 * Supported locales (each backed by its own JSON file under `locales/`):
 *   - `en`  — English (default / fallback)
 *   - `fr`  — French
 *   - `pcm` — Nigerian Pidgin
 *
 * Usage:
 * ```tsx
 * import { useTranslation } from "react-i18next";
 * const { t } = useTranslation();
 * t("payment.title"); // → "Payment"
 * ```
 *
 * @module i18n
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/translation.json";
import fr from "@/locales/fr/translation.json";
import pcm from "@/locales/pcm/translation.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  pcm: { translation: pcm },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
