import { randomUUID } from "crypto";

import type { DocumentBlock, DocumentRevision, TextDocumentConfig } from "@/lib/documents/types";
import { parseDocumentConfig } from "@/lib/documents/types";

export const MAX_DOCUMENT_REVISIONS = 20;

export function revisionPreviewText(revision: Pick<DocumentRevision, "plainTextPreview" | "blocks">): string {
  const fromPreview = revision.plainTextPreview.trim();
  if (fromPreview) return fromPreview.slice(0, 120);

  for (const block of revision.blocks) {
    const text = block.content.trim();
    if (text) return text.slice(0, 120);
  }

  return "Empty revision";
}

export function appendDocumentRevision(
  config: TextDocumentConfig,
  input: {
    label: string;
    blocks: DocumentBlock[];
    plainTextPreview: string;
    savedBy?: string;
  },
): { config: TextDocumentConfig; revision: DocumentRevision } {
  const revision: DocumentRevision = {
    id: randomUUID(),
    savedAt: new Date().toISOString(),
    label: input.label.trim() || "Revision",
    blocks: structuredClone(input.blocks),
    plainTextPreview: input.plainTextPreview,
    savedBy: input.savedBy,
  };

  const revisions = [...(config.revisions ?? []), revision].slice(-MAX_DOCUMENT_REVISIONS);

  return {
    revision,
    config: {
      ...config,
      revisions,
    },
  };
}

export function parseRevisionsFromConfig(raw: Record<string, unknown>): DocumentRevision[] {
  return parseDocumentConfig(raw).revisions ?? [];
}
