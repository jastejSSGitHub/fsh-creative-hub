"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import { ProjectInlineTitle } from "@/components/projects/project-inline-title";
import { AssetCard } from "@/components/workspace/asset-card";
import { AssetDeleteConfirmDialog } from "@/components/workspace/asset-delete-confirm-dialog";
import { ActivityFeed } from "@/components/workspace/activity-feed";
import { AssetDetailOverlay } from "@/components/workspace/asset-detail-overlay";
import { AssetGridLoading } from "@/components/workspace/asset-grid-loading";
import { AssetUploadZone } from "@/components/workspace/asset-upload-zone";
import {
  AssetUploadIndicator,
  type AssetUploadIndicatorPhase,
} from "@/components/workspace/asset-upload-indicator";
import { CreateInitiativeDialog } from "@/components/workspace/create-initiative-dialog";
import { HubContentNavigationEndOnMount } from "@/components/hub/hub-content-navigation-end-on-mount";
import { FireLeaders } from "@/components/workspace/fire-leaders";
import { IdeasCanvasBoard } from "@/components/workspace/ideas-canvas-board";
import { PresentationMode } from "@/components/workspace/presentation-mode";
import { ShareLinkDialog } from "@/components/workspace/share-link-dialog";
import { WorkspaceDetailToolbar } from "@/components/workspace/workspace-detail-toolbar";
import {
  WorkspaceViewTabs,
  type WorkspaceView,
} from "@/components/workspace/workspace-view-tabs";
import { buttonVariants } from "@/components/ui/button";
import { FilterTagRow } from "@/components/ui/filter-tag-row";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { UndoToast } from "@/components/ui/undo-toast";
import { canAdmin, canDeleteOwnAsset, canEdit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { captureWorkspaceSnapshot } from "@/lib/projects/workspace-snapshot";
import { captureReviewBoardNavigationSnapshot } from "@/lib/projects/review-board-snapshot";
import { useReviewBoardNavigationSnapshot } from "@/lib/projects/use-review-board-navigation-snapshot";
import type { ProjectCardData } from "@/lib/projects/queries";
import { PROJECTS_PATH, reviewBoardPath } from "@/lib/routes";
import { scrollToAssetCardWhenReady } from "@/lib/workspace/scroll-to-asset";
import { deleteAssetAction } from "@/lib/workspace/actions";
import {
  getMockWorkspaceAssets,
  isMockProjectId,
} from "@/lib/dev-tools/mock-collaboration-data";
import { readMockCollaborationData } from "@/lib/dev-tools/storage";
import {
  getAssetDetail,
  getAssetsForInitiative,
  type ActivityWithActor,
  type AssetWithVotes,
  type CommentWithAuthor,
  type ProjectMemberWithRole,
} from "@/lib/workspace/queries";
import type { HubInitiative, HubProject, HubProjectFile, HubRole } from "@/types/database";
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
  initialActivities?: ActivityWithActor[];
  initialIdeasCanvas?: HubProjectFile | null;
  initialIdeaCount?: number;
  authorName?: string;
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "final", label: "Final" },
];

const ASSET_DELETE_UNDO_MS = 5000;

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
  initialActivities = [],
  initialIdeasCanvas = null,
  initialIdeaCount = 0,
  authorName = "You",
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(initialView);
  const [ideaCount, setIdeaCount] = useState(initialIdeaCount);
  const [activities, setActivities] = useState<ActivityWithActor[]>(initialActivities);
  const [createInitiativeOpen, setCreateInitiativeOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [overlayAssetId, setOverlayAssetId] = useState<string | null>(openAssetId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter);
  const [localInitiativeId, setLocalInitiativeId] = useState<string | null>(
    selectedInitiativeId ?? initiatives[0]?.id ?? null,
  );
  const [uploadIndicatorPhase, setUploadIndicatorPhase] =
    useState<AssetUploadIndicatorPhase>("idle");
  const [uploadIndicatorMessage, setUploadIndicatorMessage] = useState<string>();
  const [highlightAssetId, setHighlightAssetId] = useState<string | null>(null);
  const uploadIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAssetDeleteRef = useRef<{
    asset: AssetWithVotes;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState<AssetWithVotes | null>(null);
  const [deleteToastVisible, setDeleteToastVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
    setActivities(initialActivities);
  }, [initialActivities]);

  useEffect(() => {
    setIdeaCount(initialIdeaCount);
  }, [initialIdeaCount]);

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

  function removeAssetFromGrid(asset: AssetWithVotes) {
    setAssetsByInitiative((prev) => {
      const sectionAssets = prev[asset.initiative_id];
      if (!sectionAssets) return prev;

      return {
        ...prev,
        [asset.initiative_id]: sectionAssets.filter((item) => item.id !== asset.id),
      };
    });
  }

  function restoreAssetToGrid(asset: AssetWithVotes) {
    setAssetsByInitiative((prev) => {
      const sectionAssets = prev[asset.initiative_id] ?? [];
      if (sectionAssets.some((item) => item.id === asset.id)) return prev;

      const next = [...sectionAssets, asset].sort(
        (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
      );

      return {
        ...prev,
        [asset.initiative_id]: next,
      };
    });
  }

  const commitPendingAssetDelete = useCallback(
    async (options?: { keepToast?: boolean }) => {
      const pending = pendingAssetDeleteRef.current;
      if (!pending) return;

      clearTimeout(pending.timeoutId);
      pendingAssetDeleteRef.current = null;
      if (!options?.keepToast) {
        setDeleteToastVisible(false);
      }

      const result = await deleteAssetAction(
        pending.asset.id,
        project.id,
        reviewBoard?.id,
      );

      if (!result.ok) {
        restoreAssetToGrid(pending.asset);
        setDeleteError(result.error);
      }
    },
    [project.id, reviewBoard?.id],
  );

  function queueAssetDelete(asset: AssetWithVotes) {
    void commitPendingAssetDelete({ keepToast: true });

    if (overlayAssetId === asset.id) {
      closeAssetOverlay();
    }

    removeAssetFromGrid(asset);
    setDeleteError(null);
    setDeleteToastVisible(true);

    const timeoutId = setTimeout(() => {
      void commitPendingAssetDelete();
    }, ASSET_DELETE_UNDO_MS);

    pendingAssetDeleteRef.current = { asset, timeoutId };
  }

  function undoAssetDelete() {
    const pending = pendingAssetDeleteRef.current;
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingAssetDeleteRef.current = null;
    setDeleteToastVisible(false);
    restoreAssetToGrid(pending.asset);
  }

  function handleAssetDeleteRequest(asset: AssetWithVotes) {
    if (!canDeleteOwnAsset(role, userId, asset.uploaded_by)) return;
    setDeleteConfirmAsset(asset);
  }

  function confirmAssetDelete() {
    if (!deleteConfirmAsset) return;
    const asset = deleteConfirmAsset;
    setDeleteConfirmAsset(null);
    queueAssetDelete(asset);
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

  function clearUploadIndicatorTimer() {
    if (uploadIndicatorTimerRef.current) {
      clearTimeout(uploadIndicatorTimerRef.current);
      uploadIndicatorTimerRef.current = null;
    }
  }

  function clearHighlightTimer() {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }

  function handleUploadStart() {
    clearUploadIndicatorTimer();
    clearHighlightTimer();
    setHighlightAssetId(null);
    setUploadIndicatorMessage(undefined);
    setUploadIndicatorPhase("uploading");
  }

  function handleUploadError(message: string) {
    clearUploadIndicatorTimer();
    setUploadIndicatorMessage(message);
    setUploadIndicatorPhase("error");
    uploadIndicatorTimerRef.current = setTimeout(() => {
      setUploadIndicatorPhase("idle");
      setUploadIndicatorMessage(undefined);
    }, 3200);
  }

  function handleUploadBatchEnd(lastAssetId: string | null) {
    if (lastAssetId) return;
    clearUploadIndicatorTimer();
    setUploadIndicatorPhase((phase) => (phase === "uploading" ? "idle" : phase));
  }

  function handleUploadComplete(lastAssetId: string) {
    if (statusFilter !== "all") {
      setStatusFilterInstant("all");
    }

    setUploadIndicatorPhase("success");
    setHighlightAssetId(lastAssetId);
    scrollToAssetCardWhenReady(lastAssetId);

    clearUploadIndicatorTimer();
    uploadIndicatorTimerRef.current = setTimeout(() => {
      setUploadIndicatorPhase("idle");
    }, 2200);

    clearHighlightTimer();
    highlightTimerRef.current = setTimeout(() => {
      setHighlightAssetId(null);
    }, 3200);
  }

  useEffect(() => {
    return () => {
      clearUploadIndicatorTimer();
      clearHighlightTimer();
      const pending = pendingAssetDeleteRef.current;
      if (pending) {
        clearTimeout(pending.timeoutId);
        void deleteAssetAction(pending.asset.id, project.id, reviewBoard?.id);
      }
    };
  }, [project.id, reviewBoard?.id]);

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
      if (readMockCollaborationData() && isMockProjectId(project.id)) {
        loadedInitiativeIdsRef.current.add(initiativeId);
        setAssetsByInitiative((prev) => ({
          ...prev,
          [initiativeId]: getMockWorkspaceAssets(initiativeId),
        }));
        return;
      }

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

  const reviewBoardSnapshot = useReviewBoardNavigationSnapshot(
    reviewBoard ? project.id : undefined,
    reviewBoard?.id,
  );
  const assetCountHint = reviewBoardSnapshot?.assetCount;

  const showAssetsChrome = workspaceView === "assets";
  const showInitiativeChrome = workspaceView === "assets" || workspaceView === "ideas";
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
      <HubContentNavigationEndOnMount />
      {reviewBoard && (
        <header className="sticky top-0 z-40 border-b border-hub-foreground/8 bg-hub-paper/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-3 py-2 sm:px-6">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <NavBackLink
                href={backHref ?? PROJECTS_PATH}
                label={project.name}
                className="shrink-0"
              />
              <div className="min-w-0 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
                {detailToolbar}
              </div>
            </div>
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
                ideaCount={ideaCount}
                activityCount={activities.length}
                variant="prominent"
              />
            </div>

            {showInitiativeChrome && (
              <div className="flex flex-col gap-3 border-b border-hub-foreground/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <FilterTagRow
                  aria-label="Section"
                  layoutId="review-board-section-filter"
                  items={initiatives.map((i) => ({ id: i.id, label: i.name }))}
                  value={activeInitiativeId ?? ""}
                  onChange={switchInitiative}
                  onItemHover={(id) => void ensureInitiativeAssets(id)}
                  onItemFocus={(id) => void ensureInitiativeAssets(id)}
                />
                {canEdit(role) && (
                  <button
                    type="button"
                    onClick={() => setCreateInitiativeOpen(true)}
                    className="inline-flex h-8 w-full shrink-0 items-center justify-center rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-3 text-[0.8125rem] font-medium text-hub-foreground transition-colors hover:bg-hub-foreground/[0.03] sm:ml-2 sm:w-auto"
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
                    onUploadStart={handleUploadStart}
                    onUploaded={handleAssetUploaded}
                    onUploadComplete={handleUploadComplete}
                    onUploadBatchEnd={handleUploadBatchEnd}
                    onUploadError={handleUploadError}
                  />
                )}

                <FilterTagRow
                  compact
                  aria-label="Status"
                  layoutId="review-board-status-filter"
                  items={FILTERS}
                  value={statusFilter}
                  onChange={(id) => setStatusFilterInstant(id as StatusFilter)}
                />

                <motion.div
                  layout
                  transition={{ layout: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }}
                  className="relative w-full"
                >
                  <AnimatePresence initial={false}>
                    <ReviewBoardSectionAssets
                      key={activeInitiativeId}
                      initiativeName={activeInitiative?.name ?? "This section"}
                      assets={assetsByInitiative[activeInitiativeId] ?? []}
                      statusFilter={statusFilter}
                      highlightAssetId={highlightAssetId}
                      loading={
                        initiativeAssetsLoading &&
                        (assetsByInitiative[activeInitiativeId]?.length ?? 0) === 0
                      }
                      assetCountHint={assetCountHint}
                      reduceMotion={reduceMotion ?? false}
                      role={role}
                      userId={userId}
                      showAssetMenu={canEdit(role)}
                      onOpenAsset={openAssetOverlay}
                      onDeleteRequest={handleAssetDeleteRequest}
                    />
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {activeInitiativeId && workspaceView === "ideas" && projectCardForInvite && (
              <IdeasCanvasBoard
                key={activeInitiativeId}
                project={project}
                initiativeId={activeInitiativeId}
                initiativeName={activeInitiative?.name ?? "Ideas"}
                initialCanvas={
                  activeInitiativeId === selectedInitiativeId ? initialIdeasCanvas : null
                }
                authorName={authorName}
                projectCard={projectCardForInvite}
                currentUserId={userId}
                role={role}
                onStickyCountChange={setIdeaCount}
                onViewAssets={() => setWorkspaceViewInstant("assets")}
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
          projectId={project.id}
          boardId={reviewBoard?.id}
          initialComments={
            overlayAssetId === openAssetId ? openAssetComments : []
          }
          members={members}
          role={role}
          userId={userId}
          onClose={closeAssetOverlay}
          onAssetChange={patchAssetInGrid}
          onOpenIdeas={() => {
            closeAssetOverlay();
            setWorkspaceViewInstant("ideas");
          }}
        />
      )}

      {presentationOpen && presentationAssets.length > 0 && (
        <PresentationMode
          assets={presentationAssets}
          projectName={project.name}
          initiativeName={activeInitiative?.name}
          initialIndex={presentationIndex}
          onClose={() => setPresentationOpen(false)}
          onShare={canEdit(role) && activeInitiative ? () => setShareDialogOpen(true) : undefined}
        />
      )}

      {shareDialogOpen && activeInitiative && (
        <ShareLinkDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          projectId={project.id}
          userId={userId}
          scopeType="presentation"
          scopeId={activeInitiative.id}
          defaultLabel={`${activeInitiative.name} reel`}
          assetIds={presentationAssets.map((a) => a.id)}
        />
      )}

      <AssetUploadIndicator phase={uploadIndicatorPhase} message={uploadIndicatorMessage} />

      <AssetDeleteConfirmDialog
        open={deleteConfirmAsset != null}
        assetName={deleteConfirmAsset?.name}
        onClose={() => setDeleteConfirmAsset(null)}
        onConfirm={confirmAssetDelete}
      />

      <UndoToast
        message="Asset deleted"
        visible={deleteToastVisible}
        onUndo={undoAssetDelete}
      />

      {deleteError && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[60] flex max-w-sm items-center gap-3 rounded-lg border border-hub-rejected/30 bg-hub-surface px-4 py-3 text-sm text-hub-rejected shadow-xl sm:inset-x-auto sm:right-6"
        >
          <span>{deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="shrink-0 font-medium underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

type ReviewBoardSectionAssetsProps = {
  initiativeName: string;
  assets: AssetWithVotes[];
  statusFilter: StatusFilter;
  highlightAssetId?: string | null;
  loading: boolean;
  assetCountHint?: number;
  reduceMotion: boolean;
  role: HubRole;
  userId: string;
  showAssetMenu: boolean;
  onOpenAsset: (assetId: string) => void;
  onDeleteRequest: (asset: AssetWithVotes) => void;
};

function ReviewBoardSectionAssets({
  initiativeName,
  assets,
  statusFilter,
  highlightAssetId = null,
  loading,
  assetCountHint,
  reduceMotion,
  role,
  userId,
  showAssetMenu,
  onOpenAsset,
  onDeleteRequest,
}: ReviewBoardSectionAssetsProps) {
  const isPresent = useIsPresent();
  const filteredAssets =
    statusFilter === "all"
      ? assets
      : assets.filter((asset) => asset.status === statusFilter);

  const regular = filteredAssets.filter((asset) => !asset.is_fix_candidate);
  const fixes = filteredAssets.filter((asset) => asset.is_fix_candidate);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.24, ease: [0.4, 0, 0.2, 1] }
      }
      className={cn(
        "w-full space-y-5",
        isPresent ? "relative z-10" : "pointer-events-none absolute inset-x-0 top-0 z-0",
      )}
    >
      <FireLeaders assets={assets} onOpen={onOpenAsset} />

      {loading ? (
        <AssetGridLoading assetCountHint={assetCountHint} />
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hub-foreground/15 px-6 py-12 text-center">
          <p className="font-display text-lg font-bold text-hub-foreground">
            Drop your first asset
          </p>
          <p className="mt-2 text-sm text-hub-foreground/55">
            {initiativeName} is ready for uploads.
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {regular.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                role={role}
                userId={userId}
                highlighted={asset.id === highlightAssetId}
                onOpen={() => onOpenAsset(asset.id)}
                onDeleteRequest={
                  showAssetMenu ? () => onDeleteRequest(asset) : undefined
                }
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {fixes.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    role={role}
                    userId={userId}
                    highlighted={asset.id === highlightAssetId}
                    onOpen={() => onOpenAsset(asset.id)}
                    onDeleteRequest={
                      showAssetMenu ? () => onDeleteRequest(asset) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
