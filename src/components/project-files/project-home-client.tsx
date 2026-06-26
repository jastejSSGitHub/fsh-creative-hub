"use client";

import { useState } from "react";

import { CreateReviewBoardDialog } from "@/components/project-files/create-review-board-dialog";
import { ProjectHome } from "@/components/project-files/project-home";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import type { HubProject, HubRole } from "@/types/database";

type ProjectHomeClientProps = {
  project: HubProject;
  role: HubRole;
  files: ProjectFileWithMeta[];
};

export function ProjectHomeClient({
  project,
  role,
  files,
}: ProjectHomeClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <ProjectHome
        project={project}
        role={role}
        files={files}
        onCreateReviewBoard={() => setCreateOpen(true)}
      />
      <CreateReviewBoardDialog
        projectId={project.id}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
