"use client";

import { HubErrorState } from "@/components/hub/hub-error-state";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ShareError({ error, reset }: ErrorProps) {
  return (
    <HubErrorState
      title="Share link error"
      message={error.message || "We couldn't load this shared view."}
      onRetry={reset}
      homeHref="/"
      homeLabel="Go home"
      className="min-h-[100dvh] bg-hub-paper"
    />
  );
}
