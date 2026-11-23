/**
 * Internationalisation (i18n) configuration for TrustLink.
 *
 * Initialises the i18next core singleton. The `react-i18next` binding is
 * deliberately *not* registered here: route handlers reach this module through
 * `lib/validations`, and in that bundle `react` resolves to Next's restricted
 * server-component build, where `react-i18next`'s module-scope
 * `createContext()` throws and fails the production build.
 * `components/providers/I18nProvider.tsx` publishes this instance to React
 * instead, and `vitest.setup.ts` does the same for tests.
 *
 * The instance is initialised lazily (guarded by `i18n.isInitialized`) so it is
 * safe to import this module in both the browser and Node.js (e.g. during tests
 * or SSR).
 *
 * Supported locales (each backed by its own JSON file under `locales/`):
 *   - `en`  — English (default / fallback)
 *   - `fr`  — French
 *   - `pcm` — Nigerian Pidgin
 *
 * Language detection:
 *   - Checks localStorage for saved preference
 *   - Falls back to browser language if available
 *   - Defaults to 'en' if no match found
 *
 * Language persistence:
 *   - Saves language choice to localStorage on change
 *
 * Usage:
 * ```tsx
 * import { useTranslation } from "react-i18next";
 * const { t, i18n } = useTranslation();
 * t("payment.title"); // → "Payment"
 * i18n.changeLanguage("fr"); // Switch to French
 * ```
 *
 * @module i18n
 */
import i18n from "i18next";

import en from "@/locales/en/translation.json";
import fr from "@/locales/fr/translation.json";
import pcm from "@/locales/pcm/translation.json";

const LANGUAGE_KEY = "trustlink.language";
const SUPPORTED_LANGUAGES = ["en", "fr", "pcm"];

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  pcm: { translation: pcm },
};

/**
 * Detects the user's preferred language from localStorage or browser settings.
 * Falls back to 'en' if no match is found.
 */
function detectLanguage(): string {
  if (typeof window !== "undefined") {
    // Check localStorage first
    const savedLang = window.localStorage.getItem(LANGUAGE_KEY);
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
      return savedLang;
    }

    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }
  }
  return "en";
}

if (!i18n.isInitialized) {
  const detectedLang = detectLanguage();

  i18n.init({
    resources,
    lng: detectedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

  // Persist language changes to localStorage
  i18n.on("languageChanged", (lng) => {
    if (typeof window !== "undefined" && SUPPORTED_LANGUAGES.includes(lng)) {
      window.localStorage.setItem(LANGUAGE_KEY, lng);
    }
  });
}

export default i18n;