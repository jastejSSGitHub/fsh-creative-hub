import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { DocBreadcrumb } from "@/lib/docs/navigation";
import { cn } from "@/lib/utils";

type DocsBreadcrumbsProps = {
  items: DocBreadcrumb[];
  className?: string;
};

export function DocsBreadcrumbs({ items, className }: DocsBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.title}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRight
                className="size-3 shrink-0 text-hub-foreground/30"
                aria-hidden
              />
            ) : null}

            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="truncate text-[0.8125rem] text-hub-foreground/55 transition-colors hover:text-hub-primary"
              >
                {item.title}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate text-[0.8125rem]",
                  isLast
                    ? "font-semibold text-hub-foreground"
                    : "text-hub-foreground/55",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.title}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
