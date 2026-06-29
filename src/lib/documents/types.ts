import {
  defaultDocumentCover,
  defaultDocumentIcon,
} from "@/lib/documents/defaults";

export type DocumentBlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bulletList"
  | "numberedList"
  | "quote"
  | "code"
  | "divider"
  | "pageLink"
  | "image"
  | "table"
  | "webEmbed"
  | "htmlEmbed";

export type DocumentBlock = {
  id: string;
  type: DocumentBlockType;
  content: string;
  meta?: {
    linkedFileId?: string;
    linkedFileName?: string;
    imageUrl?: string;
    imageWidth?: number;
    imageSize?: "sm" | "md" | "lg";
    imageAspectRatio?: number;
    tableRows?: string[][];
    tableColumnWidths?: number[];
    embedUrl?: string;
    embedHtml?: string;
    embedHeight?: number;
    codeLanguage?: string;
    codeFilename?: string;
  };
};

export type DocumentCover =
  | { kind: "gradient"; value: string; position?: number }
  | { kind: "image"; value: string; position?: number };

export type DocumentRevision = {
  id: string;
  savedAt: string;
  label: string;
  blocks: DocumentBlock[];
  plainTextPreview: string;
  savedBy?: string;
};

export type TextDocumentConfig = {
  version: 1;
  icon: string | null;
  cover: DocumentCover | null;
  blocks: DocumentBlock[];
  plainTextPreview: string;
  revisions?: DocumentRevision[];
};

export function emptyDocumentConfig(documentName?: string | null): TextDocumentConfig {
  return {
    version: 1,
    icon: defaultDocumentIcon(),
    cover: defaultDocumentCover(documentName),
    blocks: [createBlock("paragraph")],
    plainTextPreview: "",
  };
}

export function createBlock(type: DocumentBlockType = "paragraph"): DocumentBlock {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  if (type === "divider") {
    return { id, type, content: "" };
  }

  if (type === "table") {
    return {
      id,
      type,
      content: "",
      meta: {
        tableRows: [
          ["", ""],
          ["", ""],
        ],
      },
    };
  }

  if (type === "webEmbed") {
    return { id, type, content: "", meta: { embedUrl: "", embedHeight: 560 } };
  }

  if (type === "htmlEmbed") {
    return { id, type, content: "", meta: { embedHtml: "", embedHeight: 560 } };
  }

  if (type === "image") {
    return { id, type, content: "", meta: {} };
  }

  if (type === "code") {
    return { id, type, content: "", meta: { codeLanguage: "typescript" } };
  }

  return { id, type, content: "" };
}

export function parseDocumentCover(raw: unknown): DocumentCover | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const kind = record.kind;
  const value = record.value;

  if ((kind !== "image" && kind !== "gradient") || typeof value !== "string" || !value.trim()) {
    return null;
  }

  return {
    kind,
    value: value.trim(),
    position: typeof record.position === "number" ? record.position : undefined,
  };
}

export function parseDocumentConfig(raw: Record<string, unknown>): TextDocumentConfig {
  const fallback = emptyDocumentConfig();

  if (raw.version !== 1) return fallback;

  const blocks = Array.isArray(raw.blocks)
    ? (raw.blocks as DocumentBlock[]).filter((b) => b?.id && b?.type)
    : fallback.blocks;

  return {
    version: 1,
    icon: typeof raw.icon === "string" ? raw.icon : null,
    cover: parseDocumentCover(raw.cover),
    blocks: blocks.length ? blocks : fallback.blocks,
    plainTextPreview: typeof raw.plainTextPreview === "string" ? raw.plainTextPreview : "",
    revisions: Array.isArray(raw.revisions)
      ? (raw.revisions as DocumentRevision[]).filter(
          (r) => r?.id && r?.savedAt && r?.label && Array.isArray(r.blocks),
        )
      : undefined,
  };
}

export function buildPlainTextPreview(blocks: DocumentBlock[], title: string): string {
  const parts = [title.trim()];
  for (const block of blocks) {
    if (block.type === "divider") continue;
    const text = block.content.trim();
    if (text) parts.push(text);
  }
  return parts.join("\n").slice(0, 2000);
}
