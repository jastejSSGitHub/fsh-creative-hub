import type { ForYouItem } from "@/lib/inbox/queries";

export type QuickAddCaptureContext = {
  projectId?: string | null;
  initialValue?: string;
  assetId?: string;
  linkAssetOnCreate?: boolean;
};

const STORAGE_KEY = "fsh-quick-add-capture";

export const QUICK_ADD_CAPTURE_CHANGED = "fsh-quick-add-capture-changed";
export const OPEN_QUICK_ADD_REQUEST = "fsh-open-quick-add-request";

export function setQuickAddCaptureContext(ctx: QuickAddCaptureContext): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
    window.dispatchEvent(new CustomEvent(QUICK_ADD_CAPTURE_CHANGED));
  } catch {
    // ignore
  }
}

export function peekQuickAddCaptureContext(): QuickAddCaptureContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuickAddCaptureContext;
  } catch {
    return null;
  }
}

export function consumeQuickAddCaptureContext(): QuickAddCaptureContext | null {
  const ctx = peekQuickAddCaptureContext();
  if (!ctx) return null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return ctx;
}

export function requestOpenQuickAdd(ctx?: QuickAddCaptureContext): void {
  if (ctx) setQuickAddCaptureContext(ctx);
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_QUICK_ADD_REQUEST));
}

export function deriveCaptureFromForYouItem(item: ForYouItem): QuickAddCaptureContext {
  if (item.kind === "following") {
    if ("asset" in item) {
      return {
        projectId: item.project.id,
        assetId: item.asset.id,
        linkAssetOnCreate: true,
        initialValue: `Follow up: ${item.comment.body.slice(0, 80)}`,
      };
    }
    return {
      projectId: item.project?.id ?? item.task.project_id,
      initialValue: `Follow up: ${item.comment.body.slice(0, 80)}`,
    };
  }

  switch (item.kind) {
    case "mention":
    case "upload_thread":
    case "upload_stale":
      return {
        projectId: item.project.id,
        assetId: item.asset.id,
        linkAssetOnCreate: true,
        initialValue: `Follow up: ${item.comment.body.slice(0, 80)}`,
      };
    case "vote_requested":
      return {
        projectId: item.project.id,
        assetId: item.asset.id,
        linkAssetOnCreate: true,
        initialValue: `Vote follow-up: ${item.asset.name}`,
      };
    case "task_mention":
      return {
        projectId: item.project?.id ?? item.task.project_id,
        initialValue: `Follow up: ${item.comment.body.slice(0, 80)}`,
      };
    case "task_assigned":
    case "task_overdue":
    case "task_waiting":
      return {
        projectId: item.project?.id ?? item.task.project_id,
        initialValue: item.task.name,
      };
    case "resolve_suggested":
      return {
        projectId: item.project.id,
        assetId: item.asset.id,
        linkAssetOnCreate: true,
        initialValue: item.task.name,
      };
    default:
      return {};
  }
}
