import type { SupabaseClient } from "@supabase/supabase-js";

import { computeContentHash } from "@/lib/intelligence/content-hash";
import {
  resolveBriefItemMediaType,
  resolveBriefItemThumbnail,
} from "@/lib/intelligence/brief-thumbnails";
import {
  assetCommentHref,
  assetHref,
  projectFileHref,
  taskHref,
} from "@/lib/intelligence/deep-links";
import {
  extractCanvasContent,
  extractDocumentContent,
} from "@/lib/intelligence/extract-content";
import type {
  BuildProgressEvent,
  ContentIndexRow,
  InitiativeReviewStats,
  ProjectBrief,
  ReviewCommentBrief,
  ReviewSummary,
} from "@/lib/intelligence/types";
import { PROJECT_BRIEF_VERSION } from "@/lib/intelligence/types";
import {
  loadCachedProjectBrief,
  throwIfSupabaseError,
  tryPersistProjectBriefSnapshot,
} from "@/lib/intelligence/persistence";
import type { HubProjectFile, HubProjectFileType } from "@/types/database";

type BuildOptions = {
  force?: boolean;
  onProgress?: (event: BuildProgressEvent) => void;
};

function emit(
  onProgress: BuildOptions["onProgress"],
  stage: BuildProgressEvent["stage"],
  message: string,
) {
  onProgress?.({ stage, message });
}

function emptyReviewSummary(): ReviewSummary {
  return {
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    final: 0,
    byInitiative: [],
    recentCommentCount: 0,
    recentComments: [],
    reviewBoardId: null,
  };
}

export function normalizeReviewSummary(
  summary: Partial<ReviewSummary> & Pick<ReviewSummary, "total" | "approved" | "rejected" | "pending" | "final" | "byInitiative" | "recentCommentCount">,
): ReviewSummary {
  return {
    ...emptyReviewSummary(),
    ...summary,
    recentComments: summary.recentComments ?? [],
    reviewBoardId: summary.reviewBoardId ?? null,
  };
}

function normalizeProjectBrief(brief: ProjectBrief): ProjectBrief {
  return {
    ...brief,
    sections: {
      ...brief.sections,
      reviewSummary: normalizeReviewSummary(brief.sections.reviewSummary),
    },
  };
}

function buildHeadline(brief: Omit<ProjectBrief, "headline">): string {
  const parts: string[] = [];
  parts.push(
    `${brief.stats.fileCount} files, ${brief.stats.assetCount} assets, ${brief.stats.openTaskCount} open tasks.`,
  );

  const { reviewSummary } = brief.sections;
  if (reviewSummary.total > 0) {
    parts.push(
      `Review: ${reviewSummary.approved} approved, ${reviewSummary.pending} pending.`,
    );
  }

  if (brief.sections.workshops.length > 0) {
    parts.push(`${brief.sections.workshops.length} workshop items on canvas.`);
  }

  return parts.join(" ");
}

export async function buildProjectBrief(
  supabase: SupabaseClient,
  projectId: string,
  options: BuildOptions = {},
): Promise<{
  brief: ProjectBrief;
  fromCache: boolean;
  contentHash: string;
  progress: BuildProgressEvent[];
}> {
  const progress: BuildProgressEvent[] = [];
  const onProgress = (event: BuildProgressEvent) => {
    progress.push(event);
    options.onProgress?.(event);
  };

  emit(onProgress, "loading_snapshot", "Loading project snapshot…");

  const { data: project, error: projectError } = await supabase
    .from("hub_projects")
    .select("id, name, updated_at")
    .eq("id", projectId)
    .is("trashed_at", null)
    .maybeSingle();

  if (projectError) throw projectError;
  if (!project) throw new Error("Project not found.");

  const [
    filesResult,
    initiativesResult,
    tasksResult,
    labelsResult,
  ] = await Promise.all([
    supabase
      .from("hub_project_files")
      .select("id, name, type, config, created_at")
      .eq("project_id", projectId),
    supabase
      .from("hub_initiatives")
      .select("id, name, review_board_id, ideas_canvas_id")
      .eq("project_id", projectId),
    supabase
      .from("hub_tasks")
      .select(
        "id, name, description, completed, due_at, priority, project_id, created_at",
      )
      .eq("project_id", projectId),
    supabase
      .from("hub_labels")
      .select("name")
      .eq("scope", "workspace"),
  ]);

  throwIfSupabaseError(filesResult.error, "Could not load project files");
  throwIfSupabaseError(initiativesResult.error, "Could not load initiatives");
  throwIfSupabaseError(tasksResult.error, "Could not load tasks");
  throwIfSupabaseError(labelsResult.error, "Could not load labels");

  const files = filesResult.data;
  const initiatives = initiativesResult.data;
  const tasks = tasksResult.data;
  const labels = labelsResult.data;
  const existingBrief = await loadCachedProjectBrief(supabase, projectId);

  const initiativeIds = (initiatives ?? []).map((row) => row.id);
  const ideasCanvasIds = new Set(
    (initiatives ?? [])
      .map((row) => row.ideas_canvas_id as string | null)
      .filter(Boolean),
  );

  const visibleFiles = ((files ?? []) as HubProjectFile[]).filter(
    (file) => !ideasCanvasIds.has(file.id),
  );

  let assets: Array<{
    id: string;
    name: string;
    tag: string;
    status: string;
    type: string;
    public_url: string | null;
    initiative_id: string;
    created_at: string;
  }> = [];

  if (initiativeIds.length > 0) {
    const { data: assetRows } = await supabase
      .from("hub_assets")
      .select("id, name, tag, status, type, public_url, initiative_id, created_at")
      .in("initiative_id", initiativeIds)
      .is("variant_of", null);

    assets = assetRows ?? [];
  }

  const openTasks = (tasks ?? []).filter((task) => !task.completed);

  const taskMaxUpdatedAt = openTasks.reduce<string | null>((max, task) => {
    const created = task.created_at as string | undefined;
    if (!created) return max;
    return !max || created > max ? created : max;
  }, null);

  const contentHash = computeContentHash({
    projectUpdatedAt: (project.updated_at as string | null) ?? null,
    files: visibleFiles.map((file) => ({
      id: file.id,
      updated_at: (file as { created_at?: string }).created_at,
      configLength: JSON.stringify(file.config ?? {}).length,
    })),
    assets: assets.map((asset) => ({
      id: asset.id,
      public_url: asset.public_url,
      created_at: asset.created_at,
    })),
    openTaskCount: openTasks.length,
    taskMaxUpdatedAt,
  });

  const cached = existingBrief;
  if (!options.force && cached?.content_hash === contentHash && cached.snapshot) {
    emit(onProgress, "complete", "Snapshot ready.");
    return {
      brief: normalizeProjectBrief(cached.snapshot),
      fromCache: true,
      contentHash,
      progress,
    };
  }

  const collaterals: ProjectBrief["sections"]["collaterals"] = [];
  const workshops: ProjectBrief["sections"]["workshops"] = [];
  const documents: ProjectBrief["sections"]["documents"] = [];
  const urls: ProjectBrief["sections"]["urls"] = [];
  const indexRows: ContentIndexRow[] = [];
  let canvasNodeCount = 0;

  const canvasFiles = visibleFiles.filter((file) => file.type === "canvas");
  const docFiles = visibleFiles.filter((file) => file.type === "text_document");

  emit(
    onProgress,
    "reading_canvases",
    `Reading ${canvasFiles.length} canvas${canvasFiles.length === 1 ? "" : "es"}…`,
  );

  for (const file of canvasFiles) {
    const extracted = extractCanvasContent(
      projectId,
      file.id,
      file.name,
      (file.config ?? {}) as Record<string, unknown>,
    );
    collaterals.push(...extracted.collaterals);
    workshops.push(...extracted.workshops);
    indexRows.push(...extracted.indexRows);
    canvasNodeCount += extracted.nodeCount;
  }

  emit(
    onProgress,
    "scanning_documents",
    `Scanning ${docFiles.length} document${docFiles.length === 1 ? "" : "s"}…`,
  );

  for (const file of docFiles) {
    const extracted = extractDocumentContent(
      projectId,
      file.id,
      file.name,
      (file.config ?? {}) as Record<string, unknown>,
    );
    documents.push(...extracted.documents);
    urls.push(...extracted.urls);
    indexRows.push(...extracted.indexRows);
  }

  for (const file of visibleFiles) {
    indexRows.push({
      project_id: projectId,
      source_kind: "file",
      source_id: file.id,
      parent_file_id: file.id,
      title: file.name,
      body: file.name,
      meta: { type: file.type },
      href: projectFileHref(projectId, file.id, file.type as HubProjectFileType),
    });
  }

  emit(onProgress, "checking_review_stats", "Checking review board stats…");

  const initiativeNameById = new Map(
    (initiatives ?? []).map((row) => [row.id, row.name as string]),
  );

  const reviewSummary = emptyReviewSummary();
  const initiativeStats = new Map<string, InitiativeReviewStats>();

  for (const asset of assets) {
    reviewSummary.total += 1;
    if (asset.status === "approved") reviewSummary.approved += 1;
    else if (asset.status === "rejected") reviewSummary.rejected += 1;
    else if (asset.status === "pending") reviewSummary.pending += 1;
    else if (asset.status === "final") reviewSummary.final += 1;

    const initiativeId = asset.initiative_id;
    const existing = initiativeStats.get(initiativeId) ?? {
      initiativeId,
      name: initiativeNameById.get(initiativeId) ?? "Initiative",
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      final: 0,
    };
    existing.total += 1;
    if (asset.status === "approved") existing.approved += 1;
    if (asset.status === "rejected") existing.rejected += 1;
    if (asset.status === "pending") existing.pending += 1;
    if (asset.status === "final") existing.final += 1;
    initiativeStats.set(initiativeId, existing);

    const href = assetHref(projectId, initiativeId, asset.id);
    const thumbnailUrl = resolveBriefItemThumbnail(asset.public_url);
    const mediaType = thumbnailUrl
      ? resolveBriefItemMediaType(
          asset.public_url ?? "",
          asset.type === "video" ? "video" : "image",
        )
      : undefined;

    collaterals.push({
      id: `asset:${asset.id}`,
      kind: "asset",
      label: asset.name,
      excerpt: asset.tag,
      href,
      thumbnailUrl: thumbnailUrl ?? undefined,
      mediaType,
      meta: { status: asset.status },
    });

    indexRows.push({
      project_id: projectId,
      source_kind: "asset",
      source_id: asset.id,
      parent_file_id: null,
      title: asset.name,
      body: `${asset.tag} ${asset.status}`,
      meta: { status: asset.status, tag: asset.tag },
      href,
    });
  }

  reviewSummary.byInitiative = [...initiativeStats.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const reviewBoardFile = visibleFiles.find((file) => file.type === "review_board");
  reviewSummary.reviewBoardId = reviewBoardFile?.id ?? null;

  if (assets.length > 0) {
    const assetIds = assets.map((asset) => asset.id);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: commentRows, count } = await supabase
      .from("hub_comments")
      .select(
        `
        id,
        body,
        created_at,
        asset_id,
        author:hub_profiles (display_name),
        asset:hub_assets (
          id,
          name,
          initiative_id
        )
      `,
        { count: "exact" },
      )
      .in("asset_id", assetIds)
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    reviewSummary.recentCommentCount = count ?? 0;

    const recentComments: ReviewCommentBrief[] = [];
    for (const row of commentRows ?? []) {
      const rawAsset = row.asset as
        | { id: string; name: string; initiative_id: string }
        | { id: string; name: string; initiative_id: string }[]
        | null;
      const asset = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
      if (!asset) continue;

      const rawAuthor = row.author as
        | { display_name: string }
        | { display_name: string }[]
        | null;
      const author = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;

      recentComments.push({
        id: row.id as string,
        body: (row.body as string) ?? "",
        createdAt: row.created_at as string,
        authorName: author?.display_name ?? "Teammate",
        assetId: asset.id,
        assetName: asset.name,
        href: assetCommentHref(
          projectId,
          asset.initiative_id,
          asset.id,
          row.id as string,
        ),
      });
    }

    reviewSummary.recentComments = recentComments;
  }

  emit(onProgress, "pulling_tasks", "Pulling open tasks…");

  const now = Date.now();
  const taskHighlights: ProjectBrief["sections"]["tasks"]["highlights"] = [];
  let overdueCount = 0;

  const sortedOpenTasks = [...openTasks].sort((a, b) => {
    const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  });

  for (const task of sortedOpenTasks) {
    const isOverdue = task.due_at
      ? new Date(task.due_at).getTime() < now
      : false;
    if (isOverdue) overdueCount += 1;

    const href = taskHref(projectId, task.id);
    const item = {
      id: `task:${task.id}`,
      kind: "task" as const,
      label: task.name,
      excerpt: task.description?.slice(0, 200) ?? undefined,
      href,
      meta: {
        priority: task.priority,
        overdue: isOverdue ? 1 : 0,
      },
    };

    if (taskHighlights.length < 12) {
      taskHighlights.push(item);
    }

    indexRows.push({
      project_id: projectId,
      source_kind: "task",
      source_id: task.id,
      parent_file_id: null,
      title: task.name,
      body: task.description ?? "",
      meta: { overdue: isOverdue, priority: task.priority },
      href,
    });
  }

  const labelNames = [...new Set((labels ?? []).map((row) => row.name as string))];

  const partialBrief: Omit<ProjectBrief, "headline"> = {
    version: PROJECT_BRIEF_VERSION,
    projectId,
    projectName: project.name,
    generatedAt: new Date().toISOString(),
    sections: {
      collaterals,
      workshops,
      documents,
      reviewSummary,
      tasks: {
        open: openTasks.length,
        overdue: overdueCount,
        highlights: taskHighlights,
      },
      labels: labelNames,
      urls,
    },
    stats: {
      fileCount: visibleFiles.length,
      assetCount: assets.length,
      canvasNodeCount,
      openTaskCount: openTasks.length,
    },
  };

  const brief: ProjectBrief = normalizeProjectBrief({
    ...partialBrief,
    headline: buildHeadline(partialBrief),
  });

  emit(onProgress, "indexing", "Saving project index…");

  await tryPersistProjectBriefSnapshot(
    supabase,
    projectId,
    brief,
    contentHash,
    indexRows,
  );

  emit(onProgress, "complete", "Brief ready.");

  return {
    brief,
    fromCache: false,
    contentHash,
    progress,
  };
}

export async function resolveProjectIdFromPrompt(
  supabase: SupabaseClient,
  userId: string,
  prompt: string,
  preferredProjectId?: string | null,
): Promise<string | null> {
  if (preferredProjectId) {
    const role = await supabase
      .from("hub_project_members")
      .select("project_id")
      .eq("project_id", preferredProjectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (role.data) return preferredProjectId;
  }

  const { data: memberships } = await supabase
    .from("hub_project_members")
    .select("project_id, project:hub_projects(id, name, trashed_at)")
    .eq("user_id", userId);

  const projects = (memberships ?? [])
    .map((row) => {
      const raw = row.project as
        | { id: string; name: string; trashed_at: string | null }
        | { id: string; name: string; trashed_at: string | null }[]
        | null;
      const project = Array.isArray(raw) ? raw[0] : raw;
      if (!project || project.trashed_at) return null;
      return project;
    })
    .filter(Boolean) as Array<{ id: string; name: string }>;

  if (projects.length === 0) return null;
  if (projects.length === 1) return projects[0]!.id;

  const normalized = prompt.toLowerCase();
  const direct = projects.find((project) =>
    normalized.includes(project.name.toLowerCase()),
  );
  if (direct) return direct.id;

  return null;
}
