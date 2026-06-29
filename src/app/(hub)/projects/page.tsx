import { Suspense } from "react";

import { ProjectsPageContent } from "@/components/projects/projects-page-content";
import { ProjectsPageFallback } from "@/components/projects/projects-page-fallback";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageFallback />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
