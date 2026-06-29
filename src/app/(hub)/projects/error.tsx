"use client";

import { getUserFacingErrorMessage, HubErrorState } from "@/components/hub/hub-error-state";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProjectsError({ error, reset }: ErrorProps) {
  return (
    <HubErrorState
      title="Projects unavailable"
      message={getUserFacingErrorMessage(
        error,
        "We couldn't load your projects right now.",
      )}
      onRetry={reset}
    />
  );
}
