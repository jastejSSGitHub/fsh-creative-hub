import { ClosingCta } from "@/components/landing/closing-cta";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InternalProof } from "@/components/landing/internal-proof";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { MarqueeStrip } from "@/components/landing/marquee-strip";
import { ProblemStrip } from "@/components/landing/problem-strip";
import { LANDING_SCROLL_ID } from "@/lib/scroll-container";

type LandingPageProps = {
  isLoggedIn: boolean;
};

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  const year = new Date().getFullYear();

  return (
    <div className="landing-page flex h-dvh flex-col overflow-hidden bg-hub-paper text-hub-foreground">
      <LandingNavbar isLoggedIn={isLoggedIn} />
      <main
        id={LANDING_SCROLL_ID}
        data-fsh-scroll
        className="fsh-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <HeroSection isLoggedIn={isLoggedIn} />
        <MarqueeStrip />
        <ProblemStrip />
        <FeatureShowcase />
        <HowItWorks />
        <InternalProof />
        <ClosingCta isLoggedIn={isLoggedIn} year={year} />
      </main>
    </div>
  );
}
