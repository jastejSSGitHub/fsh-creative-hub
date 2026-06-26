import { GrainOverlay } from "@/components/landing/grain-overlay";
import { PrimaryCta } from "@/components/landing/primary-cta";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

type ClosingCtaProps = {
  isLoggedIn: boolean;
  year: number;
};

export function ClosingCta({ isLoggedIn, year }: ClosingCtaProps) {
  return (
    <section className="relative overflow-hidden bg-hub-espresso px-5 py-24 text-center text-hub-paper sm:px-8 sm:py-32">
      <GrainOverlay />
      <ScrollReveal essential className="relative z-20">
        <h2 className="font-display text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
          Stop chasing approvals.
        </h2>
        <div className="mt-12 flex justify-center">
          <PrimaryCta isLoggedIn={isLoggedIn} size="large" />
        </div>
        <p className="mt-16 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-hub-paper/35">
          FSH Creative Hub · Internal · {year}
        </p>
      </ScrollReveal>
    </section>
  );
}
