import { LandingScrollbar } from "@/components/landing/landing-scrollbar";
import { ClosingCta } from "@/components/landing/closing-cta";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InternalProof } from "@/components/landing/internal-proof";
import { MarqueeStrip } from "@/components/landing/marquee-strip";
import { ProblemStrip } from "@/components/landing/problem-strip";

type LandingPageProps = {
  isLoggedIn: boolean;
};

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-full flex-col bg-hub-paper">
      <LandingScrollbar />
      <CustomCursor />
      <HeroSection isLoggedIn={isLoggedIn} />
      <MarqueeStrip />
      <ProblemStrip />
      <FeatureShowcase />
      <HowItWorks />
      <InternalProof />
      <ClosingCta isLoggedIn={isLoggedIn} year={year} />
    </div>
  );
}
