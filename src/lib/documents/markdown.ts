import type { DocumentBlock, TextDocumentConfig } from "@/lib/documents/types";

function blockToMarkdown(block: DocumentBlock): string {
  switch (block.type) {
    case "heading1":
      return `# ${block.content}`;
    case "heading2":
      return `## ${block.content}`;
    case "heading3":
      return `### ${block.content}`;
    case "heading4":
      return `#### ${block.content}`;
    case "bulletList":
      return `- ${block.content}`;
    case "numberedList":
      return `1. ${block.content}`;
    case "quote":
      return `> ${block.content}`;
    case "code":
      return `\`\`\`\n${block.content}\n\`\`\``;
    case "divider":
      return "---";
    case "pageLink":
      return block.meta?.linkedFileName
        ? `[${block.meta.linkedFileName}](page:${block.meta.linkedFileId ?? ""})`
        : `[Page link](page:${block.meta?.linkedFileId ?? ""})`;
    case "image":
      return block.meta?.imageUrl
        ? `![${block.content || "image"}](${block.meta.imageUrl})`
        : "";
    case "webEmbed":
      return block.meta?.embedUrl ? `[Embed](${block.meta.embedUrl})` : "";
    case "htmlEmbed":
      return block.meta?.embedHtml
        ? `\`\`\`html\n${block.meta.embedHtml}\n\`\`\``
        : "";
    case "table": {
      const rows = block.meta?.tableRows ?? [["", ""]];
      if (!rows.length) return "";
      const header = `| ${rows[0]!.join(" | ")} |`;
      const sep = `| ${rows[0]!.map(() => "---").join(" | ")} |`;
      const body = rows
        .slice(1)
        .map((row) => `| ${row.join(" | ")} |`)
        .join("\n");
      return [header, sep, body].filter(Boolean).join("\n");
    }
    default:
      return block.content;
  }
}

export function documentToMarkdown(title: string, config: TextDocumentConfig): string {
  const lines: string[] = [];

  if (config.icon) {
    lines.push(`<!-- icon: ${config.icon} -->`);
  }

  lines.push(`# ${title.trim() || "Untitled"}`);
  lines.push("");

  for (const block of config.blocks) {
    const md = blockToMarkdown(block);
    if (md) {
      lines.push(md);
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function downloadMarkdown(title: string, config: TextDocumentConfig) {
  const md = documentToMarkdown(title, config);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(title.trim() || "document").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase()}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}
