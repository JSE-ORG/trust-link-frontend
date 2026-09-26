import FeaturedArtistSection from "@/components/featured/FeaturedArtistSection";

import HomePageCta from "./HomePageCta";
import HomePageFaq from "./HomePageFaq";
import HomePageFooter from "./HomePageFooter";
import HomePageHero from "./HomePageHero";
import HomePageHowItWorks from "./HomePageHowItWorks";
import HomePageTrustSignals from "./HomePageTrustSignals";

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
