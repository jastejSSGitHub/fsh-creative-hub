"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import { ProjectInlineTitle } from "@/components/projects/project-inline-title";
import { AssetCard } from "@/components/workspace/asset-card";
import { ActivityFeed } from "@/components/workspace/activity-feed";
import { AssetDetailOverlay } from "@/components/workspace/asset-detail-overlay";
import { AssetGridLoading } from "@/components/workspace/asset-grid-loading";
import { AssetUploadZone } from "@/components/workspace/asset-upload-zone";
import { CreateInitiativeDialog } from "@/components/workspace/create-initiative-dialog";
import { FireLeaders } from "@/components/workspace/fire-leaders";
import { IdeasBoard } from "@/components/workspace/ideas-board";
import { PresentationMode } from "@/components/workspace/presentation-mode";
import { WorkspaceDetailToolbar } from "@/components/workspace/workspace-detail-toolbar";
import {
  WorkspaceViewTabs,
  type WorkspaceView,
} from "@/components/workspace/workspace-view-tabs";
import { buttonVariants } from "@/components/ui/button";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { canAdmin, canEdit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { captureWorkspaceSnapshot } from "@/lib/projects/workspace-snapshot";
import { captureReviewBoardNavigationSnapshot, readReviewBoardNavigationSnapshot } from "@/lib/projects/review-board-snapshot";
import type { ProjectCardData } from "@/lib/projects/queries";
import { PROJECTS_PATH, reviewBoardPath } from "@/lib/routes";
import {
  getAssetDetail,
  getAssetsForInitiative,
  getIdeasForInitiative,
  type ActivityWithActor,
  type AssetWithVotes,
  type CommentWithAuthor,
  type IdeaWithMeta,
  type ProjectMemberWithRole,
} from "@/lib/workspace/queries";
import type { HubInitiative, HubProject, HubRole } from "@/types/database";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "final";

type ProjectWorkspaceProps = {
  project: HubProject;
  reviewBoard?: { id: string; name: string };
  role: HubRole;
  userId: string;
  initiatives: HubInitiative[];
  members: ProjectMemberWithRole[];
  assets: AssetWithVotes[];
  assetsByInitiative?: Record<string, AssetWithVotes[]>;
  selectedInitiativeId: string | null;
  initialFilter: StatusFilter;
  openAssetId: string | null;
  openAssetComments: CommentWithAuthor[];
  projectCardForInvite: ProjectCardData | null;
  backHref?: string;
  deferAssetsLoad?: boolean;
  initialView?: WorkspaceView;
  initialIdeas?: IdeaWithMeta[];
  initialActivities?: ActivityWithActor[];
};

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
  assetsByInitiative: initialAssetsByInitiative,
  selectedInitiativeId,
  initialFilter,
  openAssetId,
  openAssetComments,
  projectCardForInvite,
  backHref,
  deferAssetsLoad = false,
  initialView = "assets",
  initialIdeas = [],
  initialActivities = [],
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(initialView);
  const [ideas, setIdeas] = useState<IdeaWithMeta[]>(initialIdeas);
  const [activities, setActivities] = useState<ActivityWithActor[]>(initialActivities);
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
    if (initialAssetsByInitiative) {
      return initialAssetsByInitiative;
    }

    if (deferAssetsLoad) {
      return {};
    }

    const id = selectedInitiativeId ?? initiatives[0]?.id;
    return id ? { [id]: assets } : {};
  });
  const [initiativeAssetsLoading, setInitiativeAssetsLoading] = useState(deferAssetsLoad);
  const loadedInitiativeIdsRef = useRef(
    new Set(
      deferAssetsLoad
        ? []
        : Object.keys(initialAssetsByInitiative ?? {}),
    ),
  );
  const fetchingInitiativeIdsRef = useRef(new Set<string>());

  useEffect(() => {
    setWorkspaceView(initialView);
  }, [initialView]);

  useEffect(() => {
    setIdeas(initialIdeas);
  }, [initialIdeas]);

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

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
    if (initialAssetsByInitiative) {
      setAssetsByInitiative(initialAssetsByInitiative);
      loadedInitiativeIdsRef.current = new Set(
        Object.keys(initialAssetsByInitiative),
      );
      return;
    }

    if (deferAssetsLoad) {
      return;
    }

    const id = selectedInitiativeId ?? initiatives[0]?.id;
    if (id) {
      loadedInitiativeIdsRef.current.add(id);
      setAssetsByInitiative((prev) => ({ ...prev, [id]: assets }));
    }
  }, [selectedInitiativeId, initiatives, assets, initialAssetsByInitiative, deferAssetsLoad]);

  useEffect(() => {
    if (!deferAssetsLoad) return;

    const id = localInitiativeId ?? selectedInitiativeId ?? initiatives[0]?.id;
    if (!id) return;

    void ensureInitiativeAssets(id);
  }, [deferAssetsLoad, localInitiativeId, selectedInitiativeId, initiatives]);

  useEffect(() => {
    router.prefetch(PROJECTS_PATH);
  }, [router]);

  useEffect(() => {
    captureWorkspaceSnapshot(project.id, {
      hasInitiatives: initiatives.length > 0,
    });
  }, [project.id, initiatives.length]);

  useEffect(() => {
    if (!reviewBoard) return;

    captureReviewBoardNavigationSnapshot({
      projectId: project.id,
      boardId: reviewBoard.id,
      projectName: project.name,
      boardName: reviewBoard.name,
      sectionCount: initiatives.length,
      assetCount: Object.values(assetsByInitiative).reduce(
        (total, sectionAssets) => total + sectionAssets.length,
        0,
      ),
    });
  }, [project.id, project.name, reviewBoard, initiatives.length, assetsByInitiative]);

  const activeInitiativeId = localInitiativeId;
  const activeInitiative = initiatives.find((i) => i.id === activeInitiativeId);
  const initiativeAssets = activeInitiativeId
    ? assetsByInitiative[activeInitiativeId] ?? []
    : [];

  useEffect(() => {
    if (!activeInitiativeId || workspaceView !== "ideas") return;

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const data = await getIdeasForInitiative(supabase, activeInitiativeId, userId);
      if (!cancelled) setIdeas(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeInitiativeId, workspaceView, userId]);

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
    if (statusFilter !== "all") params.set("filter", statusFilter);
    if (workspaceView !== "assets") params.set("view", workspaceView);
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

  function patchAssetInGrid(updated: AssetWithVotes) {
    setAssetsByInitiative((prev) => {
      const sectionAssets = prev[updated.initiative_id];
      if (!sectionAssets) return prev;

      return {
        ...prev,
        [updated.initiative_id]: sectionAssets.map((asset) =>
          asset.id === updated.id ? updated : asset,
        ),
      };
    });
  }

  async function handleAssetUploaded(assetId: string) {
    const supabase = createClient();
    const asset = await getAssetDetail(supabase, assetId);
    if (!asset) return;

    loadedInitiativeIdsRef.current.add(asset.initiative_id);
    setAssetsByInitiative((prev) => ({
      ...prev,
      [asset.initiative_id]: [...(prev[asset.initiative_id] ?? []), asset],
    }));
  }

  function setStatusFilterInstant(next: StatusFilter) {
    setStatusFilter(next);
    const params = buildQueryParams();
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    syncUrl(params);
  }

  async function ensureInitiativeAssets(initiativeId: string) {
    if (
      loadedInitiativeIdsRef.current.has(initiativeId) ||
      fetchingInitiativeIdsRef.current.has(initiativeId)
    ) {
      return;
    }

    fetchingInitiativeIdsRef.current.add(initiativeId);
    setInitiativeAssetsLoading(true);
    try {
      const supabase = createClient();
      const data = await getAssetsForInitiative(supabase, initiativeId, "all");
      loadedInitiativeIdsRef.current.add(initiativeId);
      setAssetsByInitiative((prev) => ({ ...prev, [initiativeId]: data }));
    } finally {
      fetchingInitiativeIdsRef.current.delete(initiativeId);
      setInitiativeAssetsLoading(false);
    }
  }

  function setWorkspaceViewInstant(next: WorkspaceView) {
    setWorkspaceView(next);
    const params = buildQueryParams();
    if (next === "assets") params.delete("view");
    else params.set("view", next);
    syncUrl(params);
  }

  async function switchInitiative(initiativeId: string) {
    setLocalInitiativeId(initiativeId);
    setOverlayAssetId(null);

    const params = buildQueryParams(null);
    params.set("initiative", initiativeId);
    params.delete("asset");
    syncUrl(params);

    if (loadedInitiativeIdsRef.current.has(initiativeId)) return;

    await ensureInitiativeAssets(initiativeId);
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

  const memberPreviews = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        display_name: m.display_name,
        avatar_url: m.avatar_url,
        role: m.role,
      })),
    [members],
  );

  const assetCountHint = reviewBoard
    ? readReviewBoardNavigationSnapshot(project.id, reviewBoard.id)?.assetCount
    : undefined;

  const showAssetsChrome = workspaceView === "assets";
  const showPresent = showAssetsChrome && presentationAssets.length > 0;

  const detailToolbar = useMemo(
    () => (
      <WorkspaceDetailToolbar
        members={memberPreviews}
        stats={boardStats}
        showStats={showAssetsChrome && boardStats != null}
        showInvite={canAdmin(role) && projectCardForInvite != null}
        showPresent={showPresent}
        onInvite={() => setInviteOpen(true)}
        onPresent={() => {
          setPresentationIndex(0);
          setPresentationOpen(true);
        }}
      />
    ),
    [
      memberPreviews,
      boardStats,
      showAssetsChrome,
      role,
      projectCardForInvite,
      showPresent,
    ],
  );

  return (
    <>
      {reviewBoard && (
        <header className="sticky top-0 z-40 border-b border-hub-foreground/8 bg-hub-paper/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-6">
            <NavBackLink
              href={backHref ?? PROJECTS_PATH}
              label={project.name}
              className="min-w-0 shrink"
            />
            {detailToolbar}
          </div>
        </header>
      )}

      <section className="mx-auto min-w-0 max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-6">
        <div className="space-y-3">
            <div
              className={cn(
                "space-y-1",
                reviewBoard && "mx-auto max-w-2xl text-center",
              )}
            >
              {reviewBoard && (
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-hub-foreground/50">
                  Review board
                </p>
              )}
              {reviewBoard ? (
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-hub-foreground sm:text-3xl">
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

            {project.description && (
              <p
                className={cn(
                  "text-sm leading-relaxed text-hub-foreground/65 sm:text-base",
                  reviewBoard
                    ? "mx-auto max-w-2xl text-center"
                    : "max-w-2xl",
                )}
              >
                {project.description}
              </p>
            )}
          </div>

        {initiatives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hub-foreground/15 bg-hub-surface/70 px-6 py-12 text-center">
            <p className="font-display text-xl font-extrabold text-hub-foreground">
              {reviewBoard ? "Add a section to get started" : "Create your first initiative"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-hub-foreground/55">
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
            <div className="flex justify-center px-1">
              <WorkspaceViewTabs
                view={workspaceView}
                onChange={setWorkspaceViewInstant}
                ideaCount={ideas.length}
                activityCount={activities.length}
                variant="prominent"
              />
            </div>

            {showAssetsChrome && (
              <div className="flex flex-col gap-3 border-b border-hub-foreground/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="font-mono text-[0.65rem] uppercase tracking-wider text-hub-foreground/45 sm:sr-only">
                    Section
                  </label>
                  <select
                    value={activeInitiativeId ?? ""}
                    onChange={(e) => switchInitiative(e.target.value)}
                    onFocus={() => {
                      if (activeInitiativeId) void ensureInitiativeAssets(activeInitiativeId);
                    }}
                    className="min-h-10 w-full rounded-md border border-hub-foreground/15 bg-hub-surface px-3.5 text-sm sm:max-w-xs lg:hidden"
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
                        onMouseEnter={() => void ensureInitiativeAssets(i.id)}
                        onFocus={() => void ensureInitiativeAssets(i.id)}
                        className={cn(
                          "min-h-10 rounded-md border px-4 text-sm font-medium transition-colors",
                          i.id === activeInitiativeId
                            ? "border-hub-foreground bg-hub-espresso text-hub-paper"
                            : "border-hub-foreground/15 bg-hub-surface text-hub-foreground hover:bg-hub-foreground/5",
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
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-hub-foreground/15 bg-hub-surface px-4 text-sm font-medium text-hub-foreground transition-colors hover:bg-hub-foreground/[0.04] sm:w-auto"
                  >
                    + Section
                  </button>
                )}
              </div>
            )}

            {activeInitiativeId && workspaceView === "assets" && (
              <div className="space-y-5">
                {canEdit(role) && (
                  <AssetUploadZone
                    projectId={project.id}
                    boardId={reviewBoard?.id}
                    initiativeId={activeInitiativeId}
                    onUploaded={handleAssetUploaded}
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
                          ? "border-hub-foreground bg-hub-espresso text-hub-paper"
                          : "border-hub-foreground/15 bg-hub-surface text-hub-foreground/60",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                  </div>
                </div>

                <FireLeaders assets={initiativeAssets} onOpen={openAssetOverlay} />

                {initiativeAssetsLoading && initiativeAssets.length === 0 ? (
                  <AssetGridLoading assetCountHint={assetCountHint} />
                ) : initiativeAssets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-hub-foreground/15 px-6 py-12 text-center">
                    <p className="font-display text-lg font-bold text-hub-foreground">
                      Drop your first asset
                    </p>
                    <p className="mt-2 text-sm text-hub-foreground/55">
                      {activeInitiative?.name ?? "This section"} is ready for uploads.
                    </p>
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-hub-foreground/15 px-6 py-12 text-center">
                    <p className="font-display text-lg font-bold text-hub-foreground">
                      No {statusFilter} assets
                    </p>
                    <p className="mt-2 text-sm text-hub-foreground/55">
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
                                <div className="h-px flex-1 bg-hub-foreground/10" />
                                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-hub-foreground/45">
                                  Fix needed
                                </p>
                                <div className="h-px flex-1 bg-hub-foreground/10" />
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

            {activeInitiativeId && workspaceView === "ideas" && (
              <IdeasBoard
                ideas={ideas}
                initiativeId={activeInitiativeId}
                projectId={project.id}
                role={role}
                userId={userId}
              />
            )}

            {workspaceView === "activity" && (
              <ActivityFeed activities={activities} projectId={project.id} />
            )}
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
          onAssetChange={patchAssetInGrid}
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
