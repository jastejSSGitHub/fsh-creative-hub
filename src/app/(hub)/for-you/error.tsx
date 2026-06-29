"use client";

import { forYouErrorStateProps, getUserFacingErrorMessage, HubErrorState } from "@/components/hub/hub-error-state";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ForYouError({ error, reset }: ErrorProps) {
  return (
    <HubErrorState
      title="For You unavailable"
      message={getUserFacingErrorMessage(error, "We couldn't load your inbox right now.")}
      onRetry={reset}
      {...forYouErrorStateProps()}
    />
  );
}
