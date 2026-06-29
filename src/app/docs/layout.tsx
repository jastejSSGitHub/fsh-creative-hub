import type { Metadata } from "next";
import Link from "next/link";

import { DocsMobileNav, DocsSidebar } from "@/components/docs/docs-sidebar";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { DOCS_PATH, LANDING_PATH } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Documentation · FSH Creative Hub",
  description:
    "Technical documentation for FSH Creative Hub — setup, architecture, Supabase, features, and deployment.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-hub-paper text-hub-foreground">
      <header className="relative z-40 shrink-0 border-b border-hub-foreground/8 bg-hub-paper">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <DocsMobileNav />
            <NavBackLink href={LANDING_PATH} label="Creative Hub" />
          </div>
          <Link
            href={DOCS_PATH}
            className="hidden shrink-0 font-display text-sm font-bold sm:block"
          >
            Documentation
          </Link>
        </div>
      </header>

      <div
        data-fsh-scroll
        className="fsh-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto flex max-w-[90rem] gap-8 px-4 py-8 sm:px-6 lg:gap-12 lg:px-8 lg:py-12">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="docs-subtle-scrollbar sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2">
              <DocsSidebar />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 gap-10 xl:gap-14">{children}</div>
        </div>
      </div>
    </div>
  );
}
