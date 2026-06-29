import type { ForYouItem } from "@/lib/inbox/queries";
import type { ForYouLens } from "@/lib/routes";

const HOURS_48 = 48 * 60 * 60 * 1000;

export function filterForYouByLens(
  items: ForYouItem[],
  lens: ForYouLens,
  userId: string,
): ForYouItem[] {
  switch (lens) {
    case "needs-you":
      return items.filter(
        (item) =>
          item.kind === "mention" ||
          item.kind === "task_mention" ||
          item.kind === "task_assigned" ||
          item.kind === "task_overdue" ||
          item.kind === "vote_requested" ||
          item.kind === "resolve_suggested",
      );
    case "replies":
      return items.filter((item) => {
        if (item.kind === "task_mention") {
          return item.comment.parent_id != null;
        }
        if (item.kind === "mention" || item.kind === "upload_thread") {
          return item.comment.parent_id != null;
        }
        return false;
      });
    case "assigned":
      return items.filter(
        (item) => item.kind === "mention" || item.kind === "task_mention",
      );
    case "your-uploads":
      return items.filter((item) => item.kind === "upload_thread");
    case "waiting-on-others":
      return items.filter((item) => {
        if (item.kind === "task_waiting") return true;
        if (item.kind === "upload_stale") return true;
        return false;
      });
    case "following":
      return items.filter((item) => item.kind === "following");
    default:
      return items;
  }
}

export function forYouLensCounts(items: ForYouItem[]): Record<ForYouLens, number> {
  const lenses: ForYouLens[] = [
    "needs-you",
    "replies",
    "assigned",
    "waiting-on-others",
    "following",
    "your-uploads",
  ];
  const counts = {} as Record<ForYouLens, number>;
  for (const lens of lenses) {
    counts[lens] = filterForYouByLens(items, lens, "").length;
  }
  return counts;
}

export function forYouLensTitle(lens: ForYouLens): string {
  switch (lens) {
    case "needs-you":
      return "Needs you";
    case "replies":
      return "Replies";
    case "assigned":
      return "Assigned comments";
    case "waiting-on-others":
      return "Waiting on others";
    case "following":
      return "Following";
    case "your-uploads":
      return "Your uploads";
    default:
      return "For you";
  }
}

export function forYouLensDescription(lens: ForYouLens): string {
  switch (lens) {
    case "needs-you":
      return "Mentions, assignments, overdue work, and votes — sorted by urgency.";
    case "replies":
      return "Replies in threads you're part of across every project.";
    case "assigned":
      return "@mentions waiting for your response.";
    case "waiting-on-others":
      return "Tasks you delegated and uploads awaiting feedback.";
    case "following":
      return "Tasks and threads you commented on without owning.";
    case "your-uploads":
      return "Open feedback on assets you uploaded.";
    default:
      return "";
  }
}

export function isUploadStale(createdAt: string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() > HOURS_48;
}
