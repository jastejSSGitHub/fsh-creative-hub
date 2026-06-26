export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-hub-espresso/10 bg-hub-espresso px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="font-display text-2xl font-extrabold tracking-tight text-hub-final sm:text-3xl">
            FSH Creative Hub
          </p>
          <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/50">
            Internal · FSH Design
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <section className="max-w-xl space-y-4">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-hub-espresso sm:text-4xl">
            Where the team reviews, decides, and ships creative work.
          </h1>
          <p className="text-base leading-relaxed text-hub-espresso/65 sm:text-lg">
            Projects, initiatives, assets, comments, and consensus — one place
            for FSH marketing and stakeholders to collaborate on visuals.
          </p>
        </section>
      </main>
    </div>
  );
}
