import type { DocumentBlockType } from "@/lib/documents/types";

export type SlashCommand = {
  id: DocumentBlockType | "text";
  label: string;
  description: string;
  shortcut?: string;
  group: "basic" | "lists" | "advanced" | "media" | "embed";
  keywords?: string[];
};

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "text",
    label: "Text",
    description: "Plain paragraph text",
    shortcut: "p",
    group: "basic",
    keywords: ["paragraph", "plain"],
  },
  {
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    shortcut: "#",
    group: "basic",
    keywords: ["h1", "title"],
  },
  {
    id: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    shortcut: "##",
    group: "basic",
    keywords: ["h2"],
  },
  {
    id: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    shortcut: "###",
    group: "basic",
    keywords: ["h3"],
  },
  {
    id: "heading4",
    label: "Heading 4",
    description: "Smaller section heading",
    shortcut: "####",
    group: "basic",
    keywords: ["h4"],
  },
  {
    id: "bulletList",
    label: "Bulleted list",
    description: "Unordered list item",
    shortcut: "-",
    group: "lists",
    keywords: ["bullet", "ul"],
  },
  {
    id: "numberedList",
    label: "Numbered list",
    description: "Ordered list item",
    shortcut: "1.",
    group: "lists",
    keywords: ["ol", "number"],
  },
  {
    id: "quote",
    label: "Quote",
    description: "Capture a quote",
    shortcut: '"',
    group: "advanced",
    keywords: ["blockquote"],
  },
  {
    id: "code",
    label: "Code",
    description: "Code block",
    shortcut: "```",
    group: "advanced",
    keywords: ["snippet"],
  },
  {
    id: "table",
    label: "Table",
    description: "Simple 2-column table",
    group: "advanced",
    keywords: ["grid"],
  },
  {
    id: "divider",
    label: "Divider",
    description: "Visual separator",
    shortcut: "---",
    group: "advanced",
    keywords: ["line", "hr"],
  },
  {
    id: "pageLink",
    label: "Link to page",
    description: "Embed or link another document",
    group: "embed",
    keywords: ["page", "link", "embed"],
  },
  {
    id: "image",
    label: "Image",
    description: "Upload or embed with a link",
    group: "media",
    keywords: ["photo", "picture"],
  },
  {
    id: "webEmbed",
    label: "Embed link",
    description: "Embed a webpage or HTML file by URL",
    group: "embed",
    keywords: ["embed", "url", "iframe", "website", "html page"],
  },
  {
    id: "htmlEmbed",
    label: "Embed HTML",
    description: "Paste HTML markup to render inline",
    group: "embed",
    keywords: ["html", "markup", "snippet", "code"],
  },
];

export function filterSlashCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;

  return SLASH_COMMANDS.filter((cmd) => {
    const haystack = [cmd.label, cmd.description, ...(cmd.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function slashCommandToBlockType(id: SlashCommand["id"]): DocumentBlockType {
  return id === "text" ? "paragraph" : id;
}
