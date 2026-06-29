import { notFound, redirect } from "next/navigation";

import { ProjectWorkspace } from "@/components/workspace/project-workspace";
import { getProjectFile } from "@/lib/project-files/queries";
import { LOGIN_PATH, projectPath } from "@/lib/routes";
import { getProjectMembership, type ProjectCardData } from "@/lib/projects/queries";
import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import {
  getMockActivityFeed,
  getMockAssetComments,
  getMockInitiativesForBoard,
  getMockProjectMembersWithRoles,
  getMockProjectRecord,
  isMockProjectId,
  MOCK_BOARD,
  MOCK_PROJECT,
} from "@/lib/dev-tools/mock-collaboration-data";
import { createClient } from "@/lib/supabase/server";
import {
  ensureInitiativeIdeasCanvas,
  getIdeasCanvasStickyCount,
} from "@/lib/workspace/ideas-canvas";
import { getCommentsForAsset, getActivityForProject, getIdeasForInitiative, getInitiatives, getProjectMembers } from "@/lib/workspace/queries";
import type { WorkspaceView } from "@/components/workspace/workspace-view-tabs";
import type { AssetStatus, HubProject } from "@/types/database";

type ReviewBoardPageProps = {
  params: Promise<{ projectId: string; boardId: string }>;
  searchParams: Promise<{
    initiative?: string;
    filter?: string;
    asset?: string;
    view?: string;
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

  const mockEnabled = await isMockCollaborationEnabledServer();

  if (mockEnabled && isMockProjectId(projectId) && boardId === MOCK_BOARD.id) {
    const project = getMockProjectRecord(user.id);
    const initiatives = getMockInitiativesForBoard();
    const members = getMockProjectMembersWithRoles();
    const selectedInitiativeId =
      query.initiative && initiatives.some((i) => i.id === query.initiative)
        ? query.initiative
        : initiatives[0]?.id ?? null;

    const filter: AssetStatus | "all" =
      query.filter === "pending" ||
      query.filter === "approved" ||
      query.filter === "rejected" ||
      query.filter === "final"
        ? query.filter
        : "all";

    const openAssetId = query.asset ?? null;
    const initialView: WorkspaceView =
      query.view === "ideas" || query.view === "activity" ? query.view : "assets";

    const authorProfile = await supabase
      .from("hub_profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const authorName =
      authorProfile.data?.display_name ??
      user.user_metadata?.full_name ??
      user.email?.split("@")[0] ??
      "You";

    const projectCardForInvite: ProjectCardData = {
      id: project.id,
      name: project.name,
      description: project.description,
      cover_url: project.cover_url,
      created_at: project.created_at,
      updated_at: project.updated_at,
      trashed_at: null,
      role: "admin",
      isFavorite: false,
      favoritedAt: null,
      assetCount: 4,
      lastActivityAt: null,
      lastActivitySummary: "Shared Summer Menu reel via link",
      members: members.map((m) => ({
        id: m.id,
        display_name: m.display_name,
        avatar_url: m.avatar_url,
        role: m.role,
      })),
    };

    return (
      <ProjectWorkspace
        project={project}
        reviewBoard={{ id: MOCK_BOARD.id, name: MOCK_BOARD.name }}
        role="admin"
        userId={user.id}
        initiatives={initiatives}
        members={members}
        assets={[]}
        deferAssetsLoad
        selectedInitiativeId={selectedInitiativeId}
        initialFilter={filter}
        openAssetId={openAssetId}
        openAssetComments={
          openAssetId ? getMockAssetComments(openAssetId) : []
        }
        projectCardForInvite={projectCardForInvite}
        backHref={projectPath(MOCK_PROJECT.id)}
        initialView={initialView}
        initialActivities={getMockActivityFeed(user.id, authorName)}
        initialIdeasCanvas={null}
        initialIdeaCount={0}
        authorName={authorName}
      />
    );
  }

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

  const filter: AssetStatus | "all" =
    query.filter === "pending" ||
    query.filter === "approved" ||
    query.filter === "rejected" ||
    query.filter === "final"
      ? query.filter
      : "all";

  const openAssetId = query.asset ?? null;

  const initialView: WorkspaceView =
    query.view === "ideas" || query.view === "activity" ? query.view : "assets";

  const selectedInitiative =
    initiatives.find((i) => i.id === selectedInitiativeId) ?? initiatives[0] ?? null;

  const initialIdeas = selectedInitiativeId
    ? await getIdeasForInitiative(supabase, selectedInitiativeId, user.id)
    : [];

  const [openAssetComments, initialActivities, authorProfile, initialIdeasCanvas] =
    await Promise.all([
      openAssetId ? getCommentsForAsset(supabase, openAssetId) : Promise.resolve([]),
      getActivityForProject(supabase, projectId),
      supabase
        .from("hub_profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle(),
      selectedInitiativeId && selectedInitiative
        ? ensureInitiativeIdeasCanvas(
            supabase,
            projectId,
            selectedInitiativeId,
            selectedInitiative.name,
            user.id,
            initialIdeas,
          )
        : Promise.resolve(null),
    ]);

  const authorName =
    authorProfile.data?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "You";

  const initialIdeaCount = getIdeasCanvasStickyCount(initialIdeasCanvas);

  const projectCardForInvite = buildInviteProjectCard(project, role, members);

  return (
    <ProjectWorkspace
      project={project}
      reviewBoard={{ id: reviewBoard.id, name: reviewBoard.name }}
      role={role}
      userId={user.id}
      initiatives={initiatives}
      members={members}
      assets={[]}
      deferAssetsLoad
      selectedInitiativeId={selectedInitiativeId}
      initialFilter={filter}
      openAssetId={openAssetId}
      openAssetComments={openAssetComments}
      projectCardForInvite={projectCardForInvite}
      backHref={projectPath(projectId)}
      initialView={initialView}
      initialActivities={initialActivities}
      initialIdeasCanvas={initialIdeasCanvas}
      initialIdeaCount={initialIdeaCount}
      authorName={authorName}
    />
  );
}
