import type { AssetStatus } from "@/types/database";

export const STATUS_STYLES: Record<
  AssetStatus,
  { stripe: string; label: string; badge: string }
> = {
  pending: {
    stripe: "bg-hub-foreground/25",
    label: "Pending",
    badge: "border-hub-foreground/20 bg-hub-foreground/5 text-hub-foreground/70",
  },
  approved: {
    stripe: "bg-hub-approved",
    label: "Approved",
    badge: "border-hub-approved/30 bg-hub-approved/10 text-hub-foreground",
  },
  rejected: {
    stripe: "bg-hub-rejected",
    label: "Rejected",
    badge: "border-hub-rejected/30 bg-hub-rejected/10 text-hub-rejected",
  },
  final: {
    stripe: "bg-hub-final",
    label: "Final",
    badge: "border-hub-final/50 bg-hub-final/20 text-hub-foreground",
  },
};
