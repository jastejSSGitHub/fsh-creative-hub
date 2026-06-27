import Link from "next/link";

import { ForYouEmptyState } from "@/components/inbox/for-you-empty-state";
import { MemberAvatar } from "@/components/projects/member-avatar";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ForYouItem } from "@/lib/inbox/queries";
import type { ForYouView } from "@/lib/inbox/views";
import { assetPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ForYouListProps = {
  items: ForYouItem[];
  view?: ForYouView;
};

function itemLabel(kind: ForYouItem["kind"]): string {
  return kind === "mention" ? "Mention" : "Your upload";
}

function itemDescription(kind: ForYouItem["kind"]): string {
  return kind === "mention"
    ? "Someone tagged you in feedback"
    : "New thread on something you uploaded";
}

export function ForYouList({ items, view = "inbox" }: ForYouListProps) {
  if (items.length === 0) {
    return <ForYouEmptyState view={view} />;
  }

  return (
    <ul className="divide-y divide-hub-foreground/6">
      {items.map((item) => {
        const href = assetPath(
          item.project.id,
          item.initiative.id,
          item.asset.id,
        );

        return (
          <li key={item.id}>
            <Link
              href={href}
              className="group flex gap-3 px-4 py-4 transition-colors hover:bg-hub-foreground/[0.02] sm:gap-4 sm:px-6 sm:py-4"
            >
              <MemberAvatar
                displayName={item.comment.author.display_name}
                avatarUrl={item.comment.author.avatar_url}
                colorSeed={item.comment.author.id}
                variant="muted"
                size="md"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-hub-foreground">
                    {item.comment.author.display_name}
                  </span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.08em]",
                      item.kind === "mention"
                        ? "border-hub-primary/25 bg-hub-primary/10 text-hub-primary"
                        : "border-hub-final/40 bg-hub-final/20 text-hub-foreground/75",
                    )}
                  >
                    {itemLabel(item.kind)}
                  </span>
                  <span className="font-mono text-[0.58rem] text-hub-foreground/35">
                    {formatRelativeTime(item.comment.created_at)}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-hub-foreground/45">
                  {itemDescription(item.kind)}
                </p>

                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-hub-foreground/75">
                  {item.comment.body}
                </p>

                <p className="mt-3 inline-flex max-w-full flex-wrap items-center gap-x-1.5 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-hub-foreground/40">
                  <span className="truncate">{item.project.name}</span>
                  <span aria-hidden className="text-hub-foreground/20">
                    ·
                  </span>
                  <span className="truncate">{item.initiative.name}</span>
                  <span aria-hidden className="text-hub-foreground/20">
                    ·
                  </span>
                  <span className="truncate text-hub-foreground/55 group-hover:text-hub-foreground/70">
                    {item.asset.name}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
