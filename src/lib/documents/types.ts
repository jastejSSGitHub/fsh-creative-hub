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
    tableRows?: string[][];
    embedUrl?: string;
    embedHtml?: string;
    embedHeight?: number;
  };
};

export type DocumentCover =
  | { kind: "gradient"; value: string; position?: number }
  | { kind: "image"; value: string; position?: number };

export type TextDocumentConfig = {
  version: 1;
  icon: string | null;
  cover: DocumentCover | null;
  blocks: DocumentBlock[];
  plainTextPreview: string;
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

  return { id, type, content: "" };
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
    cover: (raw.cover as DocumentCover | null) ?? null,
    blocks: blocks.length ? blocks : fallback.blocks,
    plainTextPreview: typeof raw.plainTextPreview === "string" ? raw.plainTextPreview : "",
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
