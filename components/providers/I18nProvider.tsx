"use client";

import { I18nextProvider, setI18n } from "react-i18next";

import i18n from "@/lib/i18n";

// `lib/i18n` initialises the i18next core only, so route handlers can import it
// without pulling React into the server bundle (see that module's header). This
// is the client entry point, so it publishes the instance to the module-global
// that `useTranslation` falls back to for consumers rendered outside this
// provider, e.g. `OfflineBanner` and `TestnetBanner` in `app/layout.tsx`.
setI18n(i18n);

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
