import type { ForYouItem } from "@/lib/inbox/queries";

export type ForYouView = "inbox" | "replies" | "assigned";

export function filterForYouItems(
  items: ForYouItem[],
  view: ForYouView,
): ForYouItem[] {
  switch (view) {
    case "replies":
      return items.filter((item) => item.comment.parent_id != null);
    case "assigned":
      return items.filter((item) => item.kind === "mention");
    case "inbox":
    default:
      return items;
  }
}

export function forYouItemCounts(items: ForYouItem[]) {
  return {
    inbox: items.length,
    replies: items.filter((item) => item.comment.parent_id != null).length,
    assigned: items.filter((item) => item.kind === "mention").length,
  };
}

export function forYouViewTitle(view: ForYouView): string {
  switch (view) {
    case "replies":
      return "Replies";
    case "assigned":
      return "Assigned comments";
    case "inbox":
    default:
      return "Inbox";
  }
}

export function forYouViewDescription(view: ForYouView): string {
  switch (view) {
    case "replies":
      return "Replies in threads you’re part of across every project.";
    case "assigned":
      return "@mentions waiting for your response.";
    case "inbox":
    default:
      return "Mentions and open threads on assets you uploaded — across every project.";
  }
}
