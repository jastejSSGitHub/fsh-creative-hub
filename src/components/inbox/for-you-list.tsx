import Link from "next/link";

import { MemberAvatar } from "@/components/projects/member-avatar";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ForYouItem } from "@/lib/inbox/queries";
import { assetPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ForYouListProps = {
  items: ForYouItem[];
};

function itemLabel(kind: ForYouItem["kind"]): string {
  return kind === "mention" ? "Mention" : "Your upload";
}

export function ForYouList({ items }: ForYouListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-hub-espresso/12 bg-white/60 px-5 py-10 text-center">
        <p className="font-display text-base font-bold text-hub-espresso">
          You&apos;re all caught up
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-xs text-hub-espresso/50">
          @mentions and unresolved feedback on your uploads will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hub-espresso/8 overflow-hidden rounded-md border border-hub-espresso/10 bg-white">
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
              className="group flex gap-3 px-4 py-3.5 transition-colors hover:bg-hub-espresso/[0.02] sm:px-5"
            >
              <MemberAvatar
                displayName={item.comment.author.display_name}
                avatarUrl={item.comment.author.avatar_url}
                variant="muted"
                size="sm"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs font-medium text-hub-espresso">
                    {item.comment.author.display_name}
                  </span>
                  <span
                    className={cn(
                      "rounded-sm px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.08em]",
                      item.kind === "mention"
                        ? "bg-hub-espresso/6 text-hub-espresso/55"
                        : "bg-hub-final/25 text-hub-espresso/65",
                    )}
                  >
                    {itemLabel(item.kind)}
                  </span>
                  <span className="font-mono text-[0.55rem] text-hub-espresso/35">
                    {formatRelativeTime(item.comment.created_at)}
                  </span>
                </div>

                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-hub-espresso/70">
                  {item.comment.body}
                </p>

                <p className="mt-2 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-hub-espresso/40">
                  {item.project.name}
                  <span className="mx-1.5 text-hub-espresso/20">·</span>
                  {item.initiative.name}
                  <span className="mx-1.5 text-hub-espresso/20">·</span>
                  {item.asset.name}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
