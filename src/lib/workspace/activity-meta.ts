import type { ActivityVerb } from "@/types/database";

export const ACTIVITY_VERB_META: Record<
  ActivityVerb,
  { label: string; icon: string; accent: string }
> = {
  approved: {
    label: "Approved",
    icon: "✓",
    accent: "bg-hub-approved/12 text-hub-approved border-hub-approved/20",
  },
  rejected: {
    label: "Rejected",
    icon: "✕",
    accent: "bg-hub-rejected/10 text-hub-rejected border-hub-rejected/20",
  },
  commented: {
    label: "Commented",
    icon: "💬",
    accent: "bg-hub-foreground/6 text-hub-foreground/70 border-hub-foreground/12",
  },
  uploaded: {
    label: "Uploaded",
    icon: "↑",
    accent: "bg-hub-primary/10 text-hub-primary border-hub-primary/20",
  },
  voted: {
    label: "Voted",
    icon: "◆",
    accent: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  final: {
    label: "Final pick",
    icon: "★",
    accent: "bg-hub-final/25 text-hub-foreground border-hub-final/40",
  },
  restored: {
    label: "Restored",
    icon: "↺",
    accent: "bg-hub-primary/10 text-hub-primary border-hub-primary/20",
  },
  shared: {
    label: "Shared",
    icon: "⎘",
    accent: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  },
};
