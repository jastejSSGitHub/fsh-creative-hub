import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { projectPath, textDocumentPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  id: string;
  name: string;
  icon?: string | null;
};

type DocumentBreadcrumbsProps = {
  projectId: string;
  projectName: string;
  trail: BreadcrumbItem[];
  current: BreadcrumbItem;
  className?: string;
};

export function DocumentBreadcrumbs({
  projectId,
  projectName,
  trail,
  current,
  className,
}: DocumentBreadcrumbsProps) {
  const items = [
    { id: "project", name: projectName, href: projectPath(projectId) },
    ...trail.map((item) => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
      href: textDocumentPath(projectId, item.id),
    })),
    { id: current.id, name: current.name, icon: current.icon, href: null as string | null },
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex min-w-0 items-center gap-1 text-[0.8125rem]", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.id} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3 shrink-0 text-hub-foreground/30" aria-hidden />
            ) : null}

            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex min-w-0 items-center gap-1 truncate text-hub-foreground/55 transition-colors hover:text-hub-foreground"
              >
                {"icon" in item && item.icon ? (
                  <span className="text-sm">{item.icon}</span>
                ) : null}
                <span className="truncate">{item.name}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  "flex min-w-0 items-center gap-1 truncate",
                  isLast ? "font-medium text-hub-foreground" : "text-hub-foreground/55",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {"icon" in item && item.icon ? (
                  <span className="text-sm">{item.icon}</span>
                ) : null}
                <span className="truncate">{item.name}</span>
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
