import { parseCanvasConfig } from "@/lib/canvas/parse-config";
import type { CanvasNode } from "@/lib/canvas/types";
import { parseDocumentConfig } from "@/lib/documents/types";
import type { DocumentBlock } from "@/lib/documents/types";
import {
  canvasNodeHref,
  projectFileHref,
  textDocumentBlockHref,
} from "@/lib/intelligence/deep-links";
import {
  resolveBriefItemMediaType,
  resolveBriefItemThumbnail,
} from "@/lib/intelligence/brief-thumbnails";
import type { BriefItem, ContentIndexRow } from "@/lib/intelligence/types";

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;

function excerpt(text: string, max = 200): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function imageLabelFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const basename = pathname.split("/").pop() ?? "";
    if (basename.length >= 4 && /[a-zA-Z]/.test(basename)) {
      return basename.replace(/[-_]/g, " ");
    }
  } catch {
    // ignore invalid URLs
  }
  return "Image on canvas";
}

function extractUrls(text: string): string[] {
  return [...new Set(text.match(URL_PATTERN) ?? [])];
}

function isWorkshopCanvas(nodes: CanvasNode[]): boolean {
  const hasHowMightWe = nodes.some(
    (node) => node.type === "section" && node.templateId === "how-might-we",
  );
  if (hasHowMightWe) return true;

  const stickiesWithSection = nodes.filter(
    (node) => node.type === "sticky" && node.sectionId,
  ).length;

  return stickiesWithSection >= 3;
}

export function extractCanvasContent(
  projectId: string,
  canvasId: string,
  canvasName: string,
  rawConfig: Record<string, unknown>,
): {
  collaterals: BriefItem[];
  workshops: BriefItem[];
  indexRows: ContentIndexRow[];
  nodeCount: number;
} {
  const config = parseCanvasConfig(rawConfig);
  const collaterals: BriefItem[] = [];
  const workshops: BriefItem[] = [];
  const indexRows: ContentIndexRow[] = [];
  const isWorkshop = isWorkshopCanvas(config.nodes);

  for (const node of config.nodes) {
    if (node.type === "sticky") {
      const label = excerpt(node.text, 80) || "Sticky note";
      const href = canvasNodeHref(projectId, canvasId, node.id);
      const item: BriefItem = {
        id: `canvas-sticky:${node.id}`,
        kind: "canvas_node",
        label,
        excerpt: excerpt(node.text),
        href,
        meta: {
          color: node.color,
          author: node.authorName,
        },
      };

      if (isWorkshop) {
        workshops.push(item);
      } else {
        collaterals.push(item);
      }

      indexRows.push({
        project_id: projectId,
        source_kind: "canvas_sticky",
        source_id: node.id,
        parent_file_id: canvasId,
        title: label,
        body: node.text,
        meta: { canvasName, author: node.authorName },
        href,
      });
      continue;
    }

    if (node.type === "section") {
      const label = node.title || "Canvas section";
      const href = canvasNodeHref(projectId, canvasId, node.id);
      workshops.push({
        id: `canvas-section:${node.id}`,
        kind: "canvas_node",
        label,
        excerpt: node.subtitle || undefined,
        href,
      });
      indexRows.push({
        project_id: projectId,
        source_kind: "canvas_section",
        source_id: node.id,
        parent_file_id: canvasId,
        title: label,
        body: [node.title, node.subtitle].filter(Boolean).join(" — "),
        meta: { canvasName },
        href,
      });
      continue;
    }

    if (node.type === "image") {
      const label = imageLabelFromUrl(node.imageUrl);
      const href = canvasNodeHref(projectId, canvasId, node.id);
      const thumbnailUrl = resolveBriefItemThumbnail(node.imageUrl);
      collaterals.push({
        id: `canvas-image:${node.id}`,
        kind: "canvas_node",
        label,
        excerpt: canvasName,
        href,
        thumbnailUrl: thumbnailUrl ?? undefined,
        mediaType: thumbnailUrl
          ? resolveBriefItemMediaType(node.imageUrl)
          : undefined,
        meta: {
          width: node.naturalWidth ?? 0,
          height: node.naturalHeight ?? 0,
        },
      });
      indexRows.push({
        project_id: projectId,
        source_kind: "canvas_image",
        source_id: node.id,
        parent_file_id: canvasId,
        title: label,
        body: node.imageUrl,
        meta: { canvasName },
        href,
      });
      continue;
    }

    if (node.type === "embed") {
      const label = node.label?.trim() || node.embedUrl || "Embedded content";
      const href = canvasNodeHref(projectId, canvasId, node.id);
      collaterals.push({
        id: `canvas-embed:${node.id}`,
        kind: "canvas_node",
        label,
        excerpt: node.embedUrl,
        href,
        openInNewTab: Boolean(node.embedUrl),
      });
      indexRows.push({
        project_id: projectId,
        source_kind: "canvas_embed",
        source_id: node.id,
        parent_file_id: canvasId,
        title: label,
        body: node.embedUrl ?? node.embedHtml ?? "",
        meta: { canvasName },
        href,
      });
      continue;
    }

    if (node.type === "text") {
      const label = excerpt(node.text, 80) || "Text on canvas";
      const href = canvasNodeHref(projectId, canvasId, node.id);
      collaterals.push({
        id: `canvas-text:${node.id}`,
        kind: "canvas_node",
        label,
        excerpt: excerpt(node.text),
        href,
      });
      indexRows.push({
        project_id: projectId,
        source_kind: "canvas_text",
        source_id: node.id,
        parent_file_id: canvasId,
        title: label,
        body: node.text,
        meta: { canvasName },
        href,
      });
    }
  }

  if (isWorkshop && workshops.length === 0) {
    workshops.push({
      id: `canvas-workshop:${canvasId}`,
      kind: "file",
      label: canvasName,
      excerpt: "Workshop canvas",
      href: projectFileHref(projectId, canvasId, "canvas"),
    });
  }

  return {
    collaterals,
    workshops,
    indexRows,
    nodeCount: config.nodes.length,
  };
}

function blockLabel(block: DocumentBlock): string {
  if (block.type.startsWith("heading")) {
    return excerpt(block.content, 120) || "Heading";
  }
  if (block.type === "code") {
    const lang = block.meta?.codeLanguage ?? "code";
    const firstLine = block.content.split("\n")[0] ?? "";
    return firstLine ? `${lang}: ${excerpt(firstLine, 60)}` : `${lang} block`;
  }
  if (block.type === "pageLink") {
    return block.meta?.linkedFileName ?? block.content ?? "Page link";
  }
  if (block.type === "webEmbed" || block.type === "htmlEmbed") {
    return block.meta?.embedUrl ?? block.content ?? "Embed";
  }
  return excerpt(block.content, 120) || "Document block";
}

export function extractDocumentContent(
  projectId: string,
  docId: string,
  docName: string,
  rawConfig: Record<string, unknown>,
): {
  documents: BriefItem[];
  urls: BriefItem[];
  indexRows: ContentIndexRow[];
} {
  const config = parseDocumentConfig(rawConfig);
  const documents: BriefItem[] = [];
  const urls: BriefItem[] = [];
  const indexRows: ContentIndexRow[] = [];
  const seenUrls = new Set<string>();

  for (const block of config.blocks) {
    if (block.type === "divider") continue;

    const label = blockLabel(block);
    const href = textDocumentBlockHref(projectId, docId, block.id);
    const body =
      block.type === "code"
        ? block.content
        : [block.content, block.meta?.embedUrl, block.meta?.embedHtml]
            .filter(Boolean)
            .join("\n");

    if (body.trim() || block.type === "pageLink") {
      documents.push({
        id: `doc-block:${block.id}`,
        kind: "doc_block",
        label,
        excerpt: excerpt(body),
        href,
        meta: { docName },
      });

      indexRows.push({
        project_id: projectId,
        source_kind: "doc_block",
        source_id: block.id,
        parent_file_id: docId,
        title: label,
        body: excerpt(body, 2000),
        meta: { docName, blockType: block.type },
        href,
      });
    }

    const blockUrls = [
      ...extractUrls(block.content),
      ...(block.meta?.embedUrl ? [block.meta.embedUrl] : []),
    ];

    for (const url of blockUrls) {
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      urls.push({
        id: `url:${block.id}:${url}`,
        kind: "url",
        label: url,
        href: url,
        openInNewTab: true,
        meta: { docName },
      });
    }
  }

  return { documents, urls, indexRows };
}
