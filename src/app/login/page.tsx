import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-hub-paper px-5 py-16 text-center">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-hub-espresso/45">
        Sign in
      </p>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-hub-espresso sm:text-4xl">
        FSH Creative Hub
      </h1>
      <p className="mt-3 max-w-sm text-hub-espresso/60">
        Authentication will be wired in Phase 1. This route is a stub for the
        landing page CTA.
      </p>
      <Link
        href="/"
        className="mt-8 font-mono text-xs uppercase tracking-[0.12em] text-hub-espresso/50 underline-offset-4 hover:underline"
      >
        ← Back to landing
      </Link>
    </div>
  );
}
