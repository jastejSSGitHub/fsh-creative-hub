import { ScrollReveal } from "@/components/landing/scroll-reveal";

export function ProblemStrip() {
  return (
    <section className="bg-hub-paper px-5 pt-16 pb-10 text-center sm:px-8 sm:pt-20 sm:pb-12">
      <ScrollReveal>
        <p className="font-display text-[clamp(1.75rem,5vw,3.25rem)] font-extrabold leading-tight tracking-[-0.02em] text-hub-foreground">
          Creative review shouldn&apos;t live in 40 Slack messages.
        </p>
        <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-hub-foreground/45">
          So we built somewhere better.
        </p>
      </ScrollReveal>
    </section>
  );
}
