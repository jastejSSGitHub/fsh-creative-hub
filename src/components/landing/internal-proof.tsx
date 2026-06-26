import { ScrollReveal } from "@/components/landing/scroll-reveal";

const AVATAR_COLORS = [
  "bg-gradient-to-br from-[#E85D4C] to-[#F4A261]",
  "bg-gradient-to-br from-[#2A9D8F] to-[#48CAE4]",
  "bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF]",
  "bg-gradient-to-br from-[#3A86FF] to-[#FF006E]",
  "bg-gradient-to-br from-[#06D6A0] to-[#118AB2]",
];

export function InternalProof() {
  return (
    <section className="bg-hub-paper px-5 py-20 text-center sm:px-8 sm:py-28">
      <ScrollReveal essential>
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="flex items-center justify-center">
            {AVATAR_COLORS.map((color, i) => (
              <div
                key={i}
                className={`relative -ml-3 first:ml-0 size-11 rounded-full border-2 border-hub-paper shadow-md sm:size-12 ${color}`}
                style={{ zIndex: AVATAR_COLORS.length - i }}
                aria-hidden
              />
            ))}
          </div>

          <p className="mt-8 font-display text-2xl font-extrabold tracking-tight text-hub-foreground sm:text-3xl">
            Built by the FSH design team.
          </p>
          <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-hub-foreground/45">
            For the FSH design team.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
