import { notFound, redirect } from "next/navigation";

import { ProjectWorkspace } from "@/components/workspace/project-workspace";
import { getProjectFile } from "@/lib/project-files/queries";
import { LOGIN_PATH, projectPath } from "@/lib/routes";
import { getProjectMembership, type ProjectCardData } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import {
  getActivityForProject,
  getAssetsForInitiative,
  getCommentsForAsset,
  getIdeasForInitiative,
  getInitiatives,
  getProjectMembers,
} from "@/lib/workspace/queries";
import type { AssetStatus, HubProject } from "@/types/database";

type ReviewBoardPageProps = {
  params: Promise<{ projectId: string; boardId: string }>;
  searchParams: Promise<{
    initiative?: string;
    view?: string;
    filter?: string;
    asset?: string;
  }>;
};

function buildInviteProjectCard(
  project: HubProject,
  role: NonNullable<Awaited<ReturnType<typeof getProjectMembership>>>,
  members: Awaited<ReturnType<typeof getProjectMembers>>,
): ProjectCardData {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    cover_url: project.cover_url,
    created_at: project.created_at,
    updated_at: project.updated_at,
    trashed_at: project.trashed_at ?? null,
    role,
    isFavorite: false,
    favoritedAt: null,
    assetCount: 0,
    lastActivityAt: null,
    lastActivitySummary: null,
    members: members.map((member) => ({
      id: member.id,
      display_name: member.display_name,
      avatar_url: member.avatar_url,
      role: member.role,
    })),
  };
}

export default async function ReviewBoardPage({
  params,
  searchParams,
}: ReviewBoardPageProps) {
  const { projectId, boardId } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const [role, { data: project }, reviewBoard, initiatives, members] =
    await Promise.all([
      getProjectMembership(supabase, projectId, user.id),
      supabase.from("hub_projects").select("*").eq("id", projectId).maybeSingle(),
      getProjectFile(supabase, projectId, boardId),
      getInitiatives(supabase, projectId, boardId),
      getProjectMembers(supabase, projectId),
    ]);

  if (!role || !project || !reviewBoard || reviewBoard.type !== "review_board") {
    notFound();
  }

  const selectedInitiativeId =
    query.initiative && initiatives.some((i) => i.id === query.initiative)
      ? query.initiative
      : initiatives[0]?.id ?? null;

  const view =
    query.view === "ideas" || query.view === "activity" ? query.view : "assets";

  const filter: AssetStatus | "all" =
    query.filter === "pending" ||
    query.filter === "approved" ||
    query.filter === "rejected" ||
    query.filter === "final"
      ? query.filter
      : "all";

  const openAssetId = query.asset ?? null;

  const [assets, ideas, activities, openAssetComments] = await Promise.all([
    selectedInitiativeId
      ? getAssetsForInitiative(supabase, selectedInitiativeId, "all")
      : Promise.resolve([]),
    selectedInitiativeId && view === "ideas"
      ? getIdeasForInitiative(supabase, selectedInitiativeId, user.id)
      : Promise.resolve([]),
    view === "activity"
      ? getActivityForProject(supabase, projectId)
      : Promise.resolve([]),
    openAssetId
      ? getCommentsForAsset(supabase, openAssetId)
      : Promise.resolve([]),
  ]);

  const projectCardForInvite = buildInviteProjectCard(project, role, members);

  return (
    <ProjectWorkspace
      project={project}
      reviewBoard={{ id: reviewBoard.id, name: reviewBoard.name }}
      role={role}
      userId={user.id}
      initiatives={initiatives}
      members={members}
      assets={assets}
      ideas={ideas}
      activities={activities}
      selectedInitiativeId={selectedInitiativeId}
      initialView={view}
      initialFilter={filter}
      openAssetId={openAssetId}
      openAssetComments={openAssetComments}
      projectCardForInvite={projectCardForInvite}
      backHref={projectPath(projectId)}
    />
  );
}
