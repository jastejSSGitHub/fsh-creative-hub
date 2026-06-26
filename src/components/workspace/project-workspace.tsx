"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MemberAvatarStack } from "@/components/projects/member-avatar-stack";
import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import { ProjectInlineTitle } from "@/components/projects/project-inline-title";
import { ActivityFeed } from "@/components/workspace/activity-feed";
import { AssetCard } from "@/components/workspace/asset-card";
import { AssetDetailOverlay } from "@/components/workspace/asset-detail-overlay";
import { AssetUploadZone } from "@/components/workspace/asset-upload-zone";
import { CreateInitiativeDialog } from "@/components/workspace/create-initiative-dialog";
import { IdeasBoard } from "@/components/workspace/ideas-board";
import { PresentationMode } from "@/components/workspace/presentation-mode";
import { buttonVariants } from "@/components/ui/button";
import { canAdmin, canEdit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { captureWorkspaceSnapshot } from "@/lib/projects/workspace-snapshot";
import type { ProjectCardData } from "@/lib/projects/queries";
import { PROJECTS_PATH, reviewBoardPath } from "@/lib/routes";
import {
  getAssetsForInitiative,
  type ActivityWithActor,
  type AssetWithVotes,
  type CommentWithAuthor,
  type IdeaWithMeta,
  type ProjectMemberWithRole,
} from "@/lib/workspace/queries";
import type { HubInitiative, HubProject, HubRole } from "@/types/database";
import { cn } from "@/lib/utils";
import Link from "next/link";

type WorkspaceView = "assets" | "ideas" | "activity";
type StatusFilter = "all" | "pending" | "approved" | "rejected" | "final";

type ProjectWorkspaceProps = {
  project: HubProject;
  reviewBoard?: { id: string; name: string };
  role: HubRole;
  userId: string;
  initiatives: HubInitiative[];
  members: ProjectMemberWithRole[];
  assets: AssetWithVotes[];
  ideas: IdeaWithMeta[];
  activities: ActivityWithActor[];
  selectedInitiativeId: string | null;
  initialView: WorkspaceView;
  initialFilter: StatusFilter;
  openAssetId: string | null;
  openAssetComments: CommentWithAuthor[];
  projectCardForInvite: ProjectCardData | null;
  backHref?: string;
};

const VIEWS: { id: WorkspaceView; label: string }[] = [
  { id: "assets", label: "Assets" },
  { id: "ideas", label: "Ideas" },
  { id: "activity", label: "Activity" },
];

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "final", label: "Final" },
];

export function ProjectWorkspace({
  project,
  reviewBoard,
  role,
  userId,
  initiatives,
  members,
  assets,
  ideas,
  activities,
  selectedInitiativeId,
  initialView,
  initialFilter,
  openAssetId,
  openAssetComments,
  projectCardForInvite,
  backHref,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [createInitiativeOpen, setCreateInitiativeOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [overlayAssetId, setOverlayAssetId] = useState<string | null>(openAssetId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter);
  const [localInitiativeId, setLocalInitiativeId] = useState<string | null>(
    selectedInitiativeId ?? initiatives[0]?.id ?? null,
  );
  const [assetsByInitiative, setAssetsByInitiative] = useState<
    Record<string, AssetWithVotes[]>
  >(() => {
    const id = selectedInitiativeId ?? initiatives[0]?.id;
    return id ? { [id]: assets } : {};
  });
  const [initiativeAssetsLoading, setInitiativeAssetsLoading] = useState(false);

  useEffect(() => {
    setOverlayAssetId(openAssetId);
  }, [openAssetId]);

  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    setLocalInitiativeId(selectedInitiativeId ?? initiatives[0]?.id ?? null);
  }, [selectedInitiativeId, initiatives]);

  useEffect(() => {
    const id = selectedInitiativeId ?? initiatives[0]?.id;
    if (id) {
      setAssetsByInitiative((prev) => ({ ...prev, [id]: assets }));
    }
  }, [selectedInitiativeId, initiatives, assets]);

  useEffect(() => {
    router.prefetch(PROJECTS_PATH);
  }, [router]);

  useEffect(() => {
    captureWorkspaceSnapshot(project.id, {
      hasInitiatives: initiatives.length > 0,
    });
  }, [project.id, initiatives.length]);

  const activeInitiativeId = localInitiativeId;
  const activeInitiative = initiatives.find((i) => i.id === activeInitiativeId);
  const initiativeAssets = activeInitiativeId
    ? assetsByInitiative[activeInitiativeId] ?? []
    : [];

  const filteredAssets = useMemo(() => {
    if (statusFilter === "all") return initiativeAssets;
    return initiativeAssets.filter((asset) => asset.status === statusFilter);
  }, [initiativeAssets, statusFilter]);

  const overlayAsset = overlayAssetId
    ? initiativeAssets.find((a) => a.id === overlayAssetId) ??
      Object.values(assetsByInitiative)
        .flat()
        .find((a) => a.id === overlayAssetId) ??
      null
    : null;

  const boardBasePath = reviewBoard
    ? reviewBoardPath(project.id, reviewBoard.id)
    : `${PROJECTS_PATH}/${project.id}`;

  function buildQueryParams(includeAssetId = overlayAssetId) {
    const params = new URLSearchParams();
    if (activeInitiativeId) params.set("initiative", activeInitiativeId);
    params.set("view", initialView);
    if (statusFilter !== "all") params.set("filter", statusFilter);
    if (includeAssetId) params.set("asset", includeAssetId);
    return params;
  }

  function syncUrl(params: URLSearchParams) {
    const qs = params.toString();
    window.history.replaceState(null, "", `${boardBasePath}${qs ? `?${qs}` : ""}`);
  }

  function openAssetOverlay(assetId: string) {
    setOverlayAssetId(assetId);
    const params = buildQueryParams(assetId);
    syncUrl(params);
  }

  function closeAssetOverlay() {
    setOverlayAssetId(null);
    const params = buildQueryParams(null);
    syncUrl(params);
  }

  function setStatusFilterInstant(next: StatusFilter) {
    setStatusFilter(next);
    const params = buildQueryParams();
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    syncUrl(params);
  }

  async function switchInitiative(initiativeId: string) {
    setLocalInitiativeId(initiativeId);
    setOverlayAssetId(null);

    const params = buildQueryParams(null);
    params.set("initiative", initiativeId);
    params.delete("asset");
    syncUrl(params);

    if (assetsByInitiative[initiativeId]) return;

    setInitiativeAssetsLoading(true);
    try {
      const supabase = createClient();
      const data = await getAssetsForInitiative(supabase, initiativeId, "all");
      setAssetsByInitiative((prev) => ({ ...prev, [initiativeId]: data }));
    } finally {
      setInitiativeAssetsLoading(false);
    }
  }

  function setQuery(updates: Record<string, string | null>) {
    const params = buildQueryParams();

    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }

    if (updates.asset !== undefined) {
      setOverlayAssetId(updates.asset);
    }

    const qs = params.toString();
    router.push(`${boardBasePath}${qs ? `?${qs}` : ""}`);
  }

  const presentationAssets = useMemo(
    () =>
      initiativeAssets
        .filter((asset) => asset.status === "approved" || asset.status === "final")
        .sort((a, b) => {
          if (a.status === "final" && b.status !== "final") return -1;
          if (b.status === "final" && a.status !== "final") return 1;
          return a.sort_order - b.sort_order;
        }),
    [initiativeAssets],
  );

  const boardStats = useMemo(() => {
    if (!reviewBoard) return null;
    return {
      approved: initiativeAssets.filter((a) => a.status === "approved" || a.status === "final").length,
      rejected: initiativeAssets.filter((a) => a.status === "rejected").length,
      total: initiativeAssets.length,
    };
  }, [initiativeAssets, reviewBoard]);

  const memberPreviews = members.map((m) => ({
    id: m.id,
    display_name: m.display_name,
    avatar_url: m.avatar_url,
    role: m.role,
  }));

  return (
    <>
      <section className="min-w-0 space-y-5 sm:space-y-6">
        <div className="space-y-3">
            <Link
              href={backHref ?? PROJECTS_PATH}
              prefetch
              className="inline-flex font-mono text-[0.65rem] uppercase tracking-[0.14em] text-hub-espresso/45 hover:text-hub-espresso"
            >
              {reviewBoard ? `← ${project.name}` : "← All projects"}
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                {reviewBoard && (
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-hub-accent">
                    Review board
                  </p>
                )}
                {reviewBoard ? (
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-hub-espresso sm:text-3xl">
                    {reviewBoard.name}
                  </h1>
                ) : (
                  <ProjectInlineTitle
                    projectId={project.id}
                    name={project.name}
                    canRename={canAdmin(role)}
                  />
                )}
              </div>

              <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-3">
                {boardStats && initialView === "assets" && (
                  <div className="flex items-center gap-2 rounded-full border border-hub-espresso/10 bg-white px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-hub-espresso/55">
                    <span className="text-hub-approved">{boardStats.approved} approved</span>
                    <span aria-hidden>·</span>
                    <span className="text-hub-rejected">{boardStats.rejected} rejected</span>
                    <span aria-hidden>·</span>
                    <span>{boardStats.total} total</span>
                  </div>
                )}
                <MemberAvatarStack members={memberPreviews} max={6} />
                {canAdmin(role) && projectCardForInvite && (
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "min-h-10 flex-1 rounded-md sm:flex-none",
                    )}
                  >
                    Invite
                  </button>
                )}
                {initialView === "assets" && presentationAssets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPresentationIndex(0);
                      setPresentationOpen(true);
                    }}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "min-h-10 flex-1 rounded-md sm:flex-none",
                    )}
                  >
                    Present
                  </button>
                )}
              </div>
            </div>

            {project.description && (
              <p className="max-w-2xl text-sm leading-relaxed text-hub-espresso/65 sm:text-base">
                {project.description}
              </p>
            )}
          </div>

        {initiatives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hub-espresso/15 bg-white/70 px-6 py-12 text-center">
            <p className="font-display text-xl font-extrabold text-hub-espresso">
              {reviewBoard ? "Add a section to get started" : "Create your first initiative"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-hub-espresso/55">
              {reviewBoard
                ? "Sections organize your visuals — e.g. Marketing Visuals, Menus, or Video Assets."
                : "Initiatives group assets — e.g. \"Summer Campaign\" or \"Menu Refresh\"."}
            </p>
            {canEdit(role) && (
              <button
                type="button"
                onClick={() => setCreateInitiativeOpen(true)}
                className={cn(buttonVariants(), "mt-4 min-h-10 rounded-md bg-hub-espresso text-hub-paper")}
              >
                + New section
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <label className="font-mono text-[0.65rem] uppercase tracking-wider text-hub-espresso/45 sm:sr-only">
                  Section
                </label>
                <select
                  value={activeInitiativeId ?? ""}
                  onChange={(e) => switchInitiative(e.target.value)}
                  className="min-h-10 w-full rounded-md border border-hub-espresso/15 bg-white px-3.5 text-sm sm:max-w-xs lg:hidden"
                >
                  {initiatives.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                <div className="hidden flex-wrap gap-1 lg:flex">
                  {initiatives.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => switchInitiative(i.id)}
                      className={cn(
                        "min-h-10 rounded-md border px-4 text-sm font-medium transition-colors",
                        i.id === activeInitiativeId
                          ? "border-hub-espresso bg-hub-espresso text-hub-paper"
                          : "border-hub-espresso/15 bg-white text-hub-espresso hover:bg-hub-espresso/5",
                      )}
                    >
                      {i.name}
                    </button>
                  ))}
                </div>
              </div>
              {canEdit(role) && (
                <button
                  type="button"
                  onClick={() => setCreateInitiativeOpen(true)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "min-h-10 w-full rounded-md sm:w-auto",
                  )}
                >
                  + Section
                </button>
              )}
            </div>

            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-1 border-b border-hub-espresso/10 pb-1">
              {VIEWS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setQuery({ view: view.id, asset: null })}
                  className={cn(
                    "min-h-10 shrink-0 rounded-t-md px-3 text-sm font-medium sm:px-4",
                    initialView === view.id
                      ? "bg-white text-hub-espresso shadow-sm"
                      : "text-hub-espresso/50 hover:text-hub-espresso",
                  )}
                >
                  {view.label}
                </button>
              ))}
              </div>
            </div>

            {initialView === "assets" && activeInitiativeId && (
              <div className="space-y-5">
                {canEdit(role) && (
                  <AssetUploadZone
                    projectId={project.id}
                    boardId={reviewBoard?.id}
                    initiativeId={activeInitiativeId}
                    onUploaded={() => router.refresh()}
                  />
                )}

                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <div className="flex min-w-max gap-2 pb-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilterInstant(f.id)}
                      className={cn(
                        "min-h-9 shrink-0 rounded-md border px-3 text-xs font-medium uppercase tracking-wider",
                        statusFilter === f.id
                          ? "border-hub-espresso bg-hub-espresso text-hub-paper"
                          : "border-hub-espresso/15 bg-white text-hub-espresso/60",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                  </div>
                </div>

                {initiativeAssetsLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="aspect-[4/3] animate-pulse rounded-xl border border-hub-espresso/10 bg-hub-espresso/5"
                      />
                    ))}
                  </div>
                ) : initiativeAssets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-hub-espresso/15 px-6 py-12 text-center">
                    <p className="font-display text-lg font-bold text-hub-espresso">
                      Drop your first asset
                    </p>
                    <p className="mt-2 text-sm text-hub-espresso/55">
                      {activeInitiative?.name ?? "This section"} is ready for uploads.
                    </p>
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-hub-espresso/15 px-6 py-12 text-center">
                    <p className="font-display text-lg font-bold text-hub-espresso">
                      No {statusFilter} assets
                    </p>
                    <p className="mt-2 text-sm text-hub-espresso/55">
                      Try another filter or upload new work to this section.
                    </p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const regular = filteredAssets.filter((a) => !a.is_fix_candidate);
                      const fixes = filteredAssets.filter((a) => a.is_fix_candidate);
                      return (
                        <>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {regular.map((asset) => (
                              <AssetCard
                                key={asset.id}
                                asset={asset}
                                onOpen={() => openAssetOverlay(asset.id)}
                              />
                            ))}
                          </div>
                          {fixes.length > 0 && (
                            <div className="space-y-4 pt-2">
                              <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-hub-espresso/10" />
                                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-hub-espresso/45">
                                  Fix needed
                                </p>
                                <div className="h-px flex-1 bg-hub-espresso/10" />
                              </div>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {fixes.map((asset) => (
                                  <AssetCard
                                    key={asset.id}
                                    asset={asset}
                                    onOpen={() => openAssetOverlay(asset.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {initialView === "ideas" && activeInitiativeId && (
              <IdeasBoard
                ideas={ideas}
                initiativeId={activeInitiativeId}
                projectId={project.id}
                role={role}
              />
            )}

            {initialView === "activity" && <ActivityFeed activities={activities} />}
          </>
        )}
      </section>

      <CreateInitiativeDialog
        projectId={project.id}
        reviewBoardId={reviewBoard?.id}
        open={createInitiativeOpen}
        onClose={() => setCreateInitiativeOpen(false)}
      />

      {projectCardForInvite && (
        <InviteMembersDialog
          project={inviteOpen ? projectCardForInvite : null}
          currentUserId={userId}
          onClose={() => setInviteOpen(false)}
        />
      )}

      {overlayAsset && (
        <AssetDetailOverlay
          asset={overlayAsset}
          initialComments={
            overlayAssetId === openAssetId ? openAssetComments : []
          }
          members={members}
          role={role}
          userId={userId}
          onClose={closeAssetOverlay}
        />
      )}

      {presentationOpen && presentationAssets.length > 0 && (
        <PresentationMode
          assets={presentationAssets}
          projectName={project.name}
          initiativeName={activeInitiative?.name}
          initialIndex={presentationIndex}
          onClose={() => setPresentationOpen(false)}
        />
      )}
    </>
  );
}
