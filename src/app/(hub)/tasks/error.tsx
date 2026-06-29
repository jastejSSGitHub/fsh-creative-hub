"use client";

import { getUserFacingErrorMessage, HubErrorState } from "@/components/hub/hub-error-state";
import { TASKS_TODAY_PATH } from "@/lib/routes";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TasksError({ error, reset }: ErrorProps) {
  return (
    <HubErrorState
      title="Tasks unavailable"
      message={getUserFacingErrorMessage(error, "We couldn't load your tasks right now.")}
      onRetry={reset}
      homeHref={TASKS_TODAY_PATH}
      homeLabel="Go to tasks"
    />
  );
}
