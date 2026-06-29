"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, X } from "lucide-react";

import { DOCS_NAV, type DocNavItem } from "@/lib/docs/navigation";
import { cn } from "@/lib/utils";

function SidebarLink({
  item,
  depth = 0,
  onNavigate,
}: {
  item: DocNavItem;
  depth?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const href = `/docs/${item.slug}`;
  const isActive = pathname === href;

  if (item.children?.length) {
    return (
      <div className="space-y-1">
        <p
          className={cn(
            "px-3 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-hub-foreground/40",
            depth > 0 && "mt-4",
          )}
        >
          {item.title}
        </p>
        <div className="space-y-0.5 border-l border-hub-foreground/8 pl-3">
          {item.children.map((child) => (
            <SidebarLink
              key={child.slug}
              item={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "block rounded-[6px] px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-hub-accent/25 font-medium text-hub-foreground"
          : "text-hub-foreground/65 hover:bg-hub-surface-muted hover:text-hub-foreground",
      )}
    >
      {item.title}
    </Link>
  );
}

type DocsSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function DocsSidebar({ className, onNavigate }: DocsSidebarProps) {
  return (
    <nav aria-label="Documentation" className={cn("space-y-6", className)}>
      <div>
        <Link
          href="/docs"
          onClick={onNavigate}
          className="font-display text-lg font-bold tracking-tight text-hub-foreground hover:opacity-80"
        >
          FSH Docs
        </Link>
        <p className="mt-1 text-xs text-hub-foreground/50">
          Creative Hub · internal & public reference
        </p>
      </div>
      {DOCS_NAV.map((section) => (
        <SidebarLink key={section.slug} item={section} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function DocsMobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const drawer =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Documentation menu"
          >
            <button
              type="button"
              className="absolute inset-0 bg-hub-espresso/50"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-hub-paper shadow-2xl">
              <div className="flex items-center justify-between border-b border-hub-foreground/10 px-4 py-3">
                <span className="font-display font-bold">Documentation</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-[6px] hover:bg-hub-surface-muted"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="docs-subtle-scrollbar flex-1 overflow-y-auto p-4">
                <DocsSidebar onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-10 items-center justify-center rounded-[10px] border border-hub-foreground/10 bg-hub-surface text-hub-foreground"
        aria-label={open ? "Close documentation menu" : "Open documentation menu"}
        aria-expanded={open}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {drawer}
    </div>
  );
}

type DocsTocItem = {
  id: string;
  title: string;
};

type DocsTableOfContentsProps = {
  items: DocsTocItem[];
};

export function DocsTableOfContents({ items }: DocsTableOfContentsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="On this page" className="hidden xl:block">
      <p className="mb-3 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-hub-foreground/40">
        On this page
      </p>
      <ul className="space-y-2 border-l border-hub-foreground/10">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block border-l-2 border-transparent py-0.5 pl-3 text-sm text-hub-foreground/55 transition-colors hover:border-hub-accent hover:text-hub-foreground"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DocsSectionCollapse({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[10px] border border-hub-foreground/8 bg-hub-surface/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
      >
        {title}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t border-hub-foreground/8 px-4 py-3">{children}</div>
      ) : null}
    </div>
  );
}
