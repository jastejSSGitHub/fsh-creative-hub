import { ProjectsPageSkeletonView } from "@/components/projects/projects-page-skeleton-view";
import { DEFAULT_PROJECTS_PAGE_SNAPSHOT } from "@/lib/projects/snapshot";

export default function ProjectsLoading() {
  return (
    <ProjectsPageSkeletonView snapshot={DEFAULT_PROJECTS_PAGE_SNAPSHOT} />
  );
}
