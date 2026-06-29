export const PROJECT_BRIEF_VERSION = 1 as const;

export type BriefItemKind =
  | "asset"
  | "file"
  | "canvas_node"
  | "doc_block"
  | "task"
  | "url";

export type BriefItem = {
  id: string;
  kind: BriefItemKind;
  label: string;
  excerpt?: string;
  href: string;
  openInNewTab?: boolean;
  meta?: Record<string, string | number>;
};

export type InitiativeReviewStats = {
  initiativeId: string;
  name: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  final: number;
};

export type ReviewSummary = {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  final: number;
  byInitiative: InitiativeReviewStats[];
  recentCommentCount: number;
};

export type ProjectBrief = {
  version: typeof PROJECT_BRIEF_VERSION;
  projectId: string;
  projectName: string;
  generatedAt: string;
  headline: string;
  sections: {
    collaterals: BriefItem[];
    workshops: BriefItem[];
    documents: BriefItem[];
    reviewSummary: ReviewSummary;
    tasks: {
      open: number;
      overdue: number;
      highlights: BriefItem[];
    };
    labels: string[];
    urls: BriefItem[];
  };
  stats: {
    fileCount: number;
    assetCount: number;
    canvasNodeCount: number;
    openTaskCount: number;
  };
};

export type IntelligenceTemplateId =
  | "collaterals"
  | "review"
  | "blocking"
  | "full";

export type IntelligenceView = {
  templateId: IntelligenceTemplateId;
  title: string;
  summary: string;
  items: BriefItem[];
  reviewSummary?: ReviewSummary;
  taskStats?: { open: number; overdue: number };
  labels?: string[];
};

export type BuildProgressStage =
  | "loading_snapshot"
  | "reading_canvases"
  | "scanning_documents"
  | "checking_review_stats"
  | "pulling_tasks"
  | "indexing"
  | "complete";

export type BuildProgressEvent = {
  stage: BuildProgressStage;
  message: string;
};

export type IntelligenceAskResult =
  | {
      ok: true;
      brief: ProjectBrief;
      view: IntelligenceView;
      fromCache: boolean;
      isProjectAdmin: boolean;
      progress: BuildProgressEvent[];
    }
  | { ok: false; error: string };

export type ContentIndexRow = {
  project_id: string;
  source_kind:
    | "canvas_sticky"
    | "canvas_image"
    | "canvas_section"
    | "canvas_embed"
    | "canvas_text"
    | "doc_block"
    | "asset"
    | "task"
    | "file";
  source_id: string;
  parent_file_id: string | null;
  title: string;
  body: string;
  meta: Record<string, unknown>;
  href: string;
};
