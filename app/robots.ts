import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustlink.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/badge-visual-test", "/dispute-form-test"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
