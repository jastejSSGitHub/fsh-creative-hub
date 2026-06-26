import { ScrollReveal } from "@/components/landing/scroll-reveal";

const STEPS = [
  {
    number: "01",
    title: "Pick a project",
    body: "Or start a new one in seconds.",
  },
  {
    number: "02",
    title: "Drop the work",
    body: "Images, videos, ideas — straight from your desktop or phone.",
  },
  {
    number: "03",
    title: "Reach consensus",
    body: "Comment, vote, and lock the final pick. Done.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-t border-hub-espresso/8 bg-hub-paper px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
            {STEPS.map((step) => (
              <div key={step.number} className="space-y-4">
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
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
