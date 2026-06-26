"use client";

import { useState } from "react";

import { CreateCanvasDialog } from "@/components/project-files/create-canvas-dialog";
import { CreateReviewBoardDialog } from "@/components/project-files/create-review-board-dialog";
import { CreateTextDocumentDialog } from "@/components/project-files/create-text-document-dialog";
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
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createCanvasOpen, setCreateCanvasOpen] = useState(false);
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <ProjectHome
        project={project}
        role={role}
        files={files}
        projectCard={projectCard}
        currentUserId={currentUserId}
        onCreateReviewBoard={() => setCreateBoardOpen(true)}
        onCreateCanvas={() => setCreateCanvasOpen(true)}
        onCreateTextDocument={() => setCreateDocOpen(true)}
        onShare={() => setShareOpen(true)}
      />
      <CreateReviewBoardDialog
        projectId={project.id}
        open={createBoardOpen}
        onClose={() => setCreateBoardOpen(false)}
      />
      <CreateCanvasDialog
        projectId={project.id}
        open={createCanvasOpen}
        onClose={() => setCreateCanvasOpen(false)}
      />
      <CreateTextDocumentDialog
        projectId={project.id}
        open={createDocOpen}
        onClose={() => setCreateDocOpen(false)}
      />
      <InviteMembersDialog
        project={shareOpen ? projectCard : null}
        currentUserId={currentUserId}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
