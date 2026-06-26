"use client";

import { useState } from "react";

import { CreateReviewBoardDialog } from "@/components/project-files/create-review-board-dialog";
import { ProjectHome } from "@/components/project-files/project-home";
import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import type { ProjectCardData } from "@/lib/projects/queries";
import type { HubProject, HubRole } from "@/types/database";

type ProjectHomeClientProps = {
  project: HubProject;
  role: HubRole;
  files: ProjectFileWithMeta[];
  projectCard: ProjectCardData;
  currentUserId: string;
};

export function ProjectHomeClient({
  project,
  role,
  files,
  projectCard,
  currentUserId,
}: ProjectHomeClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <ProjectHome
        project={project}
        role={role}
        files={files}
        projectCard={projectCard}
        currentUserId={currentUserId}
        onCreateReviewBoard={() => setCreateOpen(true)}
        onShare={() => setShareOpen(true)}
      />
      <CreateReviewBoardDialog
        projectId={project.id}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <InviteMembersDialog
        project={shareOpen ? projectCard : null}
        currentUserId={currentUserId}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
