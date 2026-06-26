"use client";

import { ExternalLink, Globe, Code2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import {
  embedHostLabel,
  normalizeEmbedUrl,
  resolveUrlOnlyEmbed,
  wrapHtmlDocument,
} from "@/lib/documents/embed-utils";
import type { DocumentBlock } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

type EmbedBlockProps = {
  block: DocumentBlock;
  canEdit: boolean;
  onUpdate: (patch: Partial<DocumentBlock>) => void;
  onDelete?: () => void;
};

const DEFAULT_EMBED_HEIGHT = 560;

export function WebEmbedBlock({ block, canEdit, onUpdate, onDelete }: EmbedBlockProps) {
  const [draftUrl, setDraftUrl] = useState(block.meta?.embedUrl ?? "");
  const [editing, setEditing] = useState(!block.meta?.embedUrl);
  const embedUrl = block.meta?.embedUrl?.trim() ?? "";
  const height = block.meta?.embedHeight ?? DEFAULT_EMBED_HEIGHT;

  function handleSave() {
    const normalized = normalizeEmbedUrl(draftUrl);
    if (!normalized) return;
    onUpdate({
      content: embedHostLabel(normalized),
      meta: { ...block.meta, embedUrl: normalized, embedHtml: undefined, embedHeight: height },
    });
    setEditing(false);
  }

  if (editing || !embedUrl) {
    return (
      <EmbedSetupCard
        icon={Globe}
        title="Embed a webpage"
        description="Paste a link to an HTML page, Figma prototype, or any embeddable URL."
        canEdit={canEdit}
        onDelete={onDelete}
      >
        <input
          type="url"
          value={draftUrl}
          readOnly={!canEdit}
          placeholder="https://example.com/page.html"
          className={embedInputClassName}
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />
        {canEdit ? (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleSave} className={embedPrimaryButtonClassName}>
              Embed page
            </button>
            {embedUrl ? (
              <button
                type="button"
                onClick={() => {
                  setDraftUrl(embedUrl);
                  setEditing(false);
                }}
                className={embedSecondaryButtonClassName}
              >
                Cancel
              </button>
            ) : null}
          </div>
        ) : null}
      </EmbedSetupCard>
    );
  }

  return (
    <UrlEmbedFrame
      canEdit={canEdit}
      label={block.content || embedHostLabel(embedUrl)}
      url={embedUrl}
      height={height}
      onEdit={() => {
        setDraftUrl(embedUrl);
        setEditing(true);
      }}
      onDelete={onDelete}
    />
  );
}

export function HtmlEmbedBlock({ block, canEdit, onUpdate, onDelete }: EmbedBlockProps) {
  const [draftHtml, setDraftHtml] = useState(block.meta?.embedHtml ?? "");
  const [editing, setEditing] = useState(!block.meta?.embedHtml?.trim());
  const embedHtml = block.meta?.embedHtml?.trim() ?? "";
  const height = block.meta?.embedHeight ?? DEFAULT_EMBED_HEIGHT;
  const resolvedUrl = resolveUrlOnlyEmbed(embedHtml);

  useEffect(() => {
    if (!canEdit || !resolvedUrl || block.type !== "htmlEmbed") return;
    onUpdate({
      type: "webEmbed",
      content: embedHostLabel(resolvedUrl),
      meta: {
        ...block.meta,
        embedUrl: resolvedUrl,
        embedHtml: undefined,
        embedHeight: height,
      },
    });
  }, [block.meta, block.type, canEdit, height, onUpdate, resolvedUrl]);

  function handleSave() {
    const trimmed = draftHtml.trim();
    if (!trimmed) return;

    const url = resolveUrlOnlyEmbed(trimmed);
    if (url) {
      onUpdate({
        type: "webEmbed",
        content: embedHostLabel(url),
        meta: { ...block.meta, embedUrl: url, embedHtml: undefined, embedHeight: height },
      });
      setEditing(false);
      return;
    }

    onUpdate({
      content: "HTML embed",
      meta: { ...block.meta, embedHtml: trimmed, embedUrl: undefined, embedHeight: height },
    });
    setEditing(false);
  }

  const draftLooksLikeUrl = Boolean(resolveUrlOnlyEmbed(draftHtml));

  if (editing || !embedHtml) {
    return (
      <EmbedSetupCard
        icon={Code2}
        title="Embed HTML"
        description="Paste HTML markup, or paste a page URL to load it directly."
        canEdit={canEdit}
        onDelete={onDelete}
      >
        <textarea
          value={draftHtml}
          readOnly={!canEdit}
          placeholder="https://example.com/page.html — or <div>Your HTML here…</div>"
          rows={6}
          className={cn(embedInputClassName, "resize-y font-mono text-[0.8125rem] leading-relaxed")}
          onChange={(e) => setDraftHtml(e.target.value)}
        />
        {draftLooksLikeUrl ? (
          <p className="mt-2 text-[0.75rem] text-hub-primary">
            This looks like a URL — the page will load in an embedded frame.
          </p>
        ) : null}
        {canEdit ? (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleSave} className={embedPrimaryButtonClassName}>
              {draftLooksLikeUrl ? "Embed page" : "Render HTML"}
            </button>
            {embedHtml ? (
              <button
                type="button"
                onClick={() => {
                  setDraftHtml(embedHtml);
                  setEditing(false);
                }}
                className={embedSecondaryButtonClassName}
              >
                Cancel
              </button>
            ) : null}
          </div>
        ) : null}
      </EmbedSetupCard>
    );
  }

  if (resolvedUrl) {
    return (
      <UrlEmbedFrame
        canEdit={canEdit}
        label={embedHostLabel(resolvedUrl)}
        url={resolvedUrl}
        height={height}
        onEdit={() => {
          setDraftHtml(embedHtml);
          setEditing(true);
        }}
        onDelete={onDelete}
      />
    );
  }

  return (
    <EmbedFrame
      canEdit={canEdit}
      label={block.content || "HTML embed"}
      height={height}
      onEdit={() => {
        setDraftHtml(embedHtml);
        setEditing(true);
      }}
      onDelete={onDelete}
    >
      <iframe
        srcDoc={wrapHtmlDocument(embedHtml)}
        title="Embedded HTML"
        className="size-full border-0"
        sandbox="allow-scripts"
      />
    </EmbedFrame>
  );
}

function UrlEmbedFrame({
  canEdit,
  label,
  url,
  height,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  label: string;
  url: string;
  height: number;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <EmbedFrame
      canEdit={canEdit}
      label={label}
      url={url}
      height={height}
      onEdit={onEdit}
      onDelete={onDelete}
      onOpen={() => window.open(url, "_blank", "noopener,noreferrer")}
    >
      <iframe
        src={url}
        title={label}
        className="size-full border-0"
        referrerPolicy="origin-when-cross-origin"
        allowFullScreen
      />
      <EmbedBlockedHint url={url} />
    </EmbedFrame>
  );
}

function EmbedBlockedHint({ url }: { url: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-hub-surface via-hub-surface/90 to-transparent px-3 pb-2 pt-8">
      <p className="pointer-events-auto text-[0.6875rem] text-hub-foreground/50">
        Page not showing? Some sites block embedding.{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-hub-primary hover:underline"
        >
          Open in new tab
        </a>
      </p>
    </div>
  );
}

function EmbedSetupCard({
  icon: Icon,
  title,
  description,
  canEdit,
  onDelete,
  children,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
  canEdit: boolean;
  onDelete?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-hub-foreground/12 bg-hub-foreground/[0.02]">
      <div className="flex items-start gap-2 border-b border-hub-foreground/8 px-3 py-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-hub-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-medium text-hub-foreground">{title}</p>
          <p className="mt-0.5 text-[0.75rem] text-hub-foreground/50">{description}</p>
        </div>
        {canEdit && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Remove embed"
            className="inline-flex size-7 items-center justify-center rounded-[4px] text-hub-foreground/40 hover:bg-hub-rejected/10 hover:text-hub-rejected"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function EmbedFrame({
  canEdit,
  label,
  url,
  height,
  onEdit,
  onDelete,
  onOpen,
  children,
}: {
  canEdit: boolean;
  label: string;
  url?: string;
  height: number;
  onEdit: () => void;
  onDelete?: () => void;
  onOpen?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="group/embed overflow-hidden rounded-[8px] border border-hub-foreground/12 bg-hub-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-hub-foreground/8 bg-hub-foreground/[0.03] px-3 py-2">
        <Globe className="size-3.5 shrink-0 text-hub-foreground/45" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8125rem] font-medium text-hub-foreground">{label}</p>
          {url ? (
            <p className="truncate text-[0.6875rem] text-hub-foreground/45">{url}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/embed:opacity-100">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-label="Open in new tab"
              className="inline-flex size-7 items-center justify-center rounded-[4px] text-hub-foreground/45 hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
            >
              <ExternalLink className="size-3.5" aria-hidden />
            </button>
          ) : null}
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit embed"
                className="inline-flex size-7 items-center justify-center rounded-[4px] text-hub-foreground/45 hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
              >
                <Pencil className="size-3.5" aria-hidden />
              </button>
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Remove embed"
                  className="inline-flex size-7 items-center justify-center rounded-[4px] text-hub-foreground/45 hover:bg-hub-rejected/10 hover:text-hub-rejected"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      <div className="relative bg-hub-foreground/[0.02]" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

const embedInputClassName =
  "w-full rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-3 py-2 text-[0.8125rem] text-hub-foreground outline-none ring-[#18a0fb]/40 placeholder:text-hub-foreground/35 focus:border-[#18a0fb]/50 focus:ring-1";

const embedPrimaryButtonClassName =
  "inline-flex min-h-8 items-center justify-center rounded-[6px] bg-hub-primary px-3 text-[0.8125rem] font-medium text-white shadow-sm transition-colors hover:bg-[#1590e8]";

const embedSecondaryButtonClassName =
  "inline-flex min-h-8 items-center justify-center rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-3 text-[0.8125rem] font-medium text-hub-foreground transition-colors hover:bg-hub-foreground/[0.03]";
