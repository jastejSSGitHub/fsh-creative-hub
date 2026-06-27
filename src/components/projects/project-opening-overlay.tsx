"use client";

import { HubStagedLoadingOverlay } from "@/components/projects/hub-staged-loading-overlay";
import {
  PROJECT_OPENING_STAGE_MS,
  PROJECT_OPENING_STAGES,
} from "@/lib/projects/navigation-stages";

type ProjectOpeningOverlayProps = {
  visible: boolean;
  projectName?: string;
  startedAt: number | null;
};

export function ProjectOpeningOverlay({
  visible,
  projectName,
  startedAt,
}: ProjectOpeningOverlayProps) {
  return (
    <HubStagedLoadingOverlay
      visible={visible}
      stages={PROJECT_OPENING_STAGES}
      stageMs={PROJECT_OPENING_STAGE_MS}
      subtitle={projectName}
      startedAt={startedAt}
    />
  );
}
