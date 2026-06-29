import Link from "next/link";

import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { flattenDocNav } from "@/lib/docs/navigation";

export default function DocsIndexPage() {
  const pages = flattenDocNav();

  return (
    <div className="min-w-0 flex-1">
      <header className="mb-10 border-b border-hub-foreground/8 pb-10">
        <DocsBreadcrumbs items={[{ title: "Docs" }]} className="mb-3" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Documentation
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-hub-foreground/65">
          Everything your team needs to run, extend, and ship Creative Hub —
          from local setup to Supabase, features, and deployment.
        </p>
      </header>

      <DocsCallout variant="tip" title="Start here">
        New to the codebase? Begin with{" "}
        <Link href="/docs/getting-started/quick-start" className="underline">
          Quick Start
        </Link>{" "}
        then read the{" "}
        <Link href="/docs/architecture/overview" className="underline">
          Architecture overview
        </Link>
        .
      </DocsCallout>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {pages.slice(0, 8).map((page) => (
          <Link
            key={page.slug}
            href={`/docs/${page.slug}`}
            className="rounded-[10px] border border-hub-foreground/10 bg-hub-surface p-5 transition-colors hover:border-hub-foreground/20 hover:bg-hub-surface-muted"
          >
            <h2 className="font-medium text-hub-foreground">{page.title}</h2>
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider text-hub-foreground/40">
              {page.slug}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-hub-foreground/55">
        Browse the full table of contents in the sidebar, or use the mobile menu
        on smaller screens.
      </p>
    </div>
  );
}
