"use client";

import { HowItWorksStepVisual } from "@/components/landing/how-it-works-step-visual";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { SectionErrorBoundary } from "@/components/landing/section-error-boundary";

const STEPS = [
  {
    number: "01",
    title: "Pick a project",
    body: "Or start a new one in seconds.",
    visual: "pick" as const,
  },
  {
    number: "02",
    title: "Drop the work",
    body: "Images, videos, ideas — straight from your desktop or phone.",
    visual: "drop" as const,
  },
  {
    number: "03",
    title: "Reach consensus",
    body: "Comment, vote, and lock the final pick. Done.",
    visual: "consensus" as const,
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-t border-hub-espresso/8 bg-hub-paper px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          {STEPS.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.1}>
              <div className="space-y-4">
                <SectionErrorBoundary
                  fallback={
                    <div className="flex aspect-[5/4] min-h-[10.5rem] items-center justify-center rounded-lg border border-dashed border-hub-espresso/15 bg-white/80" />
                  }
                >
                  <HowItWorksStepVisual step={step.visual} />
                </SectionErrorBoundary>

                <p className="font-mono text-sm tracking-[0.08em] text-hub-accent">
                  {step.number}
                </p>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-hub-espresso sm:text-3xl">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-hub-espresso/60">
                  {step.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
