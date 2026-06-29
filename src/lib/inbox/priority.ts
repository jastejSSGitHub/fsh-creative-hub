import type { ForYouItem } from "@/lib/inbox/queries";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function scoreForYouItem(item: ForYouItem, now = new Date()): number {
  switch (item.kind) {
    case "task_overdue":
      return 100;
    case "task_assigned": {
      if (item.task.due_at) {
        const due = new Date(item.task.due_at);
        if (due >= startOfToday() && due <= endOfToday()) return 80;
      }
      return 30;
    }
    case "mention":
      return 70;
    case "task_mention":
      return 65;
    case "upload_thread":
      return 50;
    case "vote_requested":
      return 40;
    case "resolve_suggested":
      return 75;
    default:
      return 20;
  }
}

export function sortForYouItems(items: ForYouItem[], now = new Date()): ForYouItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff = scoreForYouItem(b, now) - scoreForYouItem(a, now);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      new Date(b.sort_at).getTime() - new Date(a.sort_at).getTime()
    );
  });
}
