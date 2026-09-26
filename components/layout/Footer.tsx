"use client";

import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t, i18n } = useTranslation();

  return (
    <footer className="border-t border-zinc-200 bg-white py-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} {t("footer.copyright")}
        </p>
        <div className="flex items-center gap-2">
          <label
            htmlFor="language-select"
            className="text-sm text-zinc-500 dark:text-zinc-400"
          >
            {t("footer.language")}:
          </label>
          <select
            id="language-select"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            aria-label={t("footer.selectLanguage")}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="pcm">Pidgin</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
