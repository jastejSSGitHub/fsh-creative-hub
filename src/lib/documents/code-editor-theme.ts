import type { Monaco } from "@monaco-editor/react";

export const CURSOR_EDITOR_THEME = "cursor-dark";

export function registerCursorEditorTheme(monaco: Monaco) {
  monaco.editor.defineTheme(CURSOR_EDITOR_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6A9955", fontStyle: "italic" },
      { token: "keyword", foreground: "569CD6" },
      { token: "string", foreground: "CE9178" },
      { token: "number", foreground: "B5CEA8" },
      { token: "type", foreground: "4EC9B0" },
      { token: "type.identifier", foreground: "4EC9B0" },
      { token: "function", foreground: "DCDCAA" },
      { token: "identifier", foreground: "9CDCFE" },
      { token: "tag", foreground: "569CD6" },
      { token: "attribute.name", foreground: "9CDCFE" },
      { token: "attribute.value", foreground: "CE9178" },
      { token: "delimiter", foreground: "D4D4D4" },
      { token: "metatag", foreground: "569CD6" },
      { token: "key", foreground: "9CDCFE" },
    ],
    colors: {
      "editor.background": "#1a1a1a",
      "editor.foreground": "#D4D4D4",
      "editorLineNumber.foreground": "#6e7681",
      "editorLineNumber.activeForeground": "#C9D1D9",
      "editor.selectionBackground": "#264F78",
      "editor.inactiveSelectionBackground": "#264F7844",
      "editor.lineHighlightBackground": "#262626",
      "editor.lineHighlightBorder": "#00000000",
      "editorCursor.foreground": "#AEAFAD",
      "editorIndentGuide.background1": "#30363d",
      "editorIndentGuide.activeBackground1": "#484f58",
      "editorGutter.background": "#1a1a1a",
      "editorWidget.background": "#252526",
      "editorBracketMatch.background": "#0064001a",
      "editorBracketMatch.border": "#88888855",
      "editorOverviewRuler.border": "#00000000",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff18",
      "scrollbarSlider.hoverBackground": "#ffffff28",
      "minimap.background": "#1a1a1a",
    },
  });
}

export const CODE_LANGUAGES = [
  { id: "typescript", label: "TypeScript", extension: "ts" },
  { id: "javascript", label: "JavaScript", extension: "js" },
  { id: "html", label: "HTML", extension: "html" },
  { id: "css", label: "CSS", extension: "css" },
  { id: "json", label: "JSON", extension: "json" },
  { id: "python", label: "Python", extension: "py" },
  { id: "sql", label: "SQL", extension: "sql" },
  { id: "shell", label: "Shell", extension: "sh" },
] as const;

export type CodeLanguageId = (typeof CODE_LANGUAGES)[number]["id"];

export function detectCodeLanguage(source: string): CodeLanguageId {
  const trimmed = source.trim();
  if (!trimmed) return "typescript";

  if (/^<!DOCTYPE\s/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return "html";
  }

  if (/^\s*[.#\[]?[\w-]+\s*\{/.test(trimmed) || /--[\w-]+\s*:/.test(trimmed)) {
    return "css";
  }

  if (/^\s*[\[{]/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* not json */
    }
  }

  if (/^\s*(def|class|import|from)\s+\w+/m.test(trimmed) && /:\s*$/.test(trimmed.split("\n")[0] ?? "")) {
    return "python";
  }

  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE)\s/i.test(trimmed)) {
    return "sql";
  }

  if (/^\s*(#!\/|echo |export |npm |curl )/.test(trimmed)) {
    return "shell";
  }

  if (/:\s*(string|number|boolean|void|Promise|Record|Array)/.test(trimmed)) {
    return "typescript";
  }

  return "javascript";
}

export function languageFilename(language: CodeLanguageId, custom?: string): string {
  if (custom?.trim()) return custom.trim();
  const match = CODE_LANGUAGES.find((item) => item.id === language);
  return `snippet.${match?.extension ?? "txt"}`;
}

export function countCodeLines(source: string): number {
  if (!source.trim()) return 0;
  return source.split("\n").length;
}
