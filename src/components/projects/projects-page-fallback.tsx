"use client";

import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { ProjectsPageSkeletonView } from "@/components/projects/projects-page-skeleton-view";
import { readHubTabCache } from "@/lib/hub/tab-cache";
import { DEFAULT_PROJECTS_PAGE_SNAPSHOT } from "@/lib/projects/snapshot";
import type { ProjectCardData } from "@/lib/projects/queries";

type ProjectsTabCache = {
  projects: ProjectCardData[];
  currentUserId: string;
};

export function ProjectsPageFallback() {
  const cached = readHubTabCache<ProjectsTabCache>("projects");

  if (cached?.projects?.length) {
    return (
      <ProjectsPageClient
        projects={cached.projects}
        currentUserId={cached.currentUserId}
      />
    );
  }

  return (
    <ProjectsPageSkeletonView snapshot={DEFAULT_PROJECTS_PAGE_SNAPSHOT} />
  );
}
