"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

/**
 * Site-wide footer.
 *
 * Shows a copyright line (current year + translated brand string) and a
 * language `<select>` that switches the active i18next locale on change.
 */
export default function Footer(): ReactElement {
  const { t, i18n } = useTranslation();
  const columns = [
    {
      title: "product",
      links: [
        { label: "dashboard", href: "/dashboard" },
        { label: "create", href: "/create" },
        { label: "tracking", href: "/tracking" },
        { label: "pricing", href: "/pricing" },
      ],
    },
    {
      title: "resources",
      links: [
        { label: "docs", href: "/docs" },
        { label: "stellarExplorer", href: "https://stellar.expert/explorer/public", external: true },
        { label: "github", href: "https://github.com/JSE-ORG/trust-link-frontend", external: true },
      ],
    },
    {
      title: "company",
      links: [
        { label: "about", href: "/about" },
        { label: "contact", href: "/contact" },
      ],
    },
    { title: "legal", links: [] },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white py-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map(({ title, links }) => (
            <nav key={title} aria-label={t(`footer.links.${title}`)}>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t(`footer.links.${title}`)}
              </h2>
              {title === "legal" ? (
                <p className="max-w-48 text-sm text-zinc-500 dark:text-zinc-400">
                  {t("footer.links.comingSoon")}
                </p>
              ) : <ul className="space-y-2">
                {links.map(({ label, href, ...options }) => (
                  <li key={label}>
                    {options.external ? (
                      <a href={href} target="_blank" rel="noreferrer" className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
                        {t(`footer.links.${label}`)}
                      </a>
                    ) : (
                      <Link href={href} className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
                        {t(`footer.links.${label}`)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>}
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center dark:border-zinc-800">
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
      </div>
    </footer>
  );
}
