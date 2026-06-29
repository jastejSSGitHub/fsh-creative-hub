"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsTableOfContents } from "@/components/docs/docs-sidebar";
import { DocsToastProvider } from "@/components/docs/docs-toast-provider";
import { getAdjacentDocs, getDocBreadcrumbs } from "@/lib/docs/navigation";
import { cn } from "@/lib/utils";

type DocsTocItem = {
  id: string;
  title: string;
};

type DocsArticleProps = {
  title: string;
  description?: string;
  slug: string;
  toc?: DocsTocItem[];
  children: ReactNode;
  className?: string;
};

export function DocsArticle({
  title,
  description,
  slug,
  toc = [],
  children,
  className,
}: DocsArticleProps) {
  const { prev, next } = getAdjacentDocs(slug);
  const breadcrumbs = getDocBreadcrumbs(slug);

  return (
    <DocsToastProvider>
      <article className={cn("min-w-0 flex-1", className)}>
        <header className="mb-8 border-b border-hub-foreground/8 pb-8">
          <DocsBreadcrumbs items={breadcrumbs} className="mb-3" />
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-hub-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hub-foreground/60 sm:text-[0.95rem]">
              {description}
            </p>
          ) : null}
        </header>

        <div className="docs-content">{children}</div>

        <footer className="mt-16 border-t border-hub-foreground/8 pt-8">
          <div
            className={cn(
              "grid gap-4",
              prev && next ? "sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {prev ? (
              <Link
                href={`/docs/${prev.slug}`}
                className="group flex w-full flex-col rounded-[10px] border border-hub-foreground/10 bg-hub-surface p-4 transition-colors hover:border-hub-foreground/20 hover:bg-hub-surface-muted"
              >
                <span className="mb-1 flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-wider text-hub-foreground/45">
                  <ArrowLeft className="size-3" /> Previous
                </span>
                <span className="font-medium text-hub-foreground group-hover:text-hub-espresso">
                  {prev.title}
                </span>
              </Link>
            ) : null}
            {next ? (
              <Link
                href={`/docs/${next.slug}`}
                className={cn(
                  "group flex w-full flex-col rounded-[10px] border border-hub-foreground/10 bg-hub-surface p-4 transition-colors hover:border-hub-foreground/20 hover:bg-hub-surface-muted",
                  prev ? "text-right" : "text-left",
                )}
              >
                <span
                  className={cn(
                    "mb-1 flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-wider text-hub-foreground/45",
                    prev && "justify-end",
                  )}
                >
                  Next <ArrowRight className="size-3" />
                </span>
                <span className="font-medium text-hub-foreground group-hover:text-hub-espresso">
                  {next.title}
                </span>
              </Link>
            ) : null}
          </div>
        </footer>
      </article>

      {toc.length > 0 ? (
        <aside className="hidden w-52 shrink-0 xl:block">
          <div className="sticky top-24">
            <DocsTableOfContents items={toc} />
          </div>
        </aside>
      ) : null}
    </DocsToastProvider>
  );
}
