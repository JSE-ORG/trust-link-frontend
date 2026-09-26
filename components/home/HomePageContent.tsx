import FeaturedArtistSection from "@/components/featured/FeaturedArtistSection";

import HomePageCta from "./HomePageCta";
import HomePageFaq from "./HomePageFaq";
import HomePageFooter from "./HomePageFooter";
import HomePageHero from "./HomePageHero";
import HomePageHowItWorks from "./HomePageHowItWorks";
import HomePageTrustSignals from "./HomePageTrustSignals";

/**
 * Renders the marketing home page content for TrustLink.
 *
 * This is a static, presentational component with no props, no internal
 * state, and no side effects: it composes a hero section, a three-step
 * "How It Works" explainer, a trust-signals grid, the
 * {@link FeaturedArtistSection}, an FAQ section (driven by {@link FAQ_ITEMS}
 * via {@link FaqAccordion}), a closing call-to-action, and the site footer.
 *
 * @returns The rendered home page markup.
 */
export default function HomePageContent() {
  return (
    <div className="min-h-screen bg-[var(--muted-bg)]">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <HomePageHero />

      {/* ── How It Works Section ──────────────────────────────────────────── */}
      <HomePageHowItWorks />

      {/* ── Trust Signals Section ─────────────────────────────────────────── */}
      <HomePageTrustSignals />

      {/* ── Featured Artists Section ──────────────────────────────────────── */}
      <FeaturedArtistSection />

      {/* ── FAQ Section ───────────────────────────────────────────────────── */}
      <HomePageFaq />

      {/* ── CTA Section ───────────────────────────────────────────────────── */}
      <HomePageCta />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <HomePageFooter />
    </div>
  );
}
