"use client";

import { useEffect, useState } from "react";

import { ProjectsPageSkeletonView } from "@/components/projects/projects-page-skeleton-view";
import {
  DEFAULT_PROJECTS_PAGE_SNAPSHOT,
  readProjectsPageSnapshot,
  type ProjectsPageSnapshot,
} from "@/lib/projects/snapshot";

type ProjectsPageSkeletonProps = {
  snapshot?: ProjectsPageSnapshot;
};

export function ProjectsPageSkeleton({
  snapshot: snapshotProp,
}: ProjectsPageSkeletonProps = {}) {
  const [storedSnapshot, setStoredSnapshot] = useState(
    DEFAULT_PROJECTS_PAGE_SNAPSHOT,
  );

  useEffect(() => {
    setStoredSnapshot(readProjectsPageSnapshot());
  }, []);

  const snapshot = snapshotProp ?? storedSnapshot;

  return <ProjectsPageSkeletonView snapshot={snapshot} />;
}
