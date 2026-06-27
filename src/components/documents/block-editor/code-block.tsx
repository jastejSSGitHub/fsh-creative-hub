"use client";

import { Check, Code2, Copy, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

import { applySmartCodeFolding } from "@/lib/documents/code-editor-folding";
import {
  CODE_LANGUAGES,
  countCodeLines,
  CURSOR_EDITOR_THEME,
  detectCodeLanguage,
  languageFilename,
  registerCursorEditorTheme,
  type CodeLanguageId,
} from "@/lib/documents/code-editor-theme";
import type { DocumentBlock } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[120px] items-center justify-center bg-[#1a1a1a]">
      <span className="font-mono text-[0.6875rem] tracking-wide text-white/35">
        Loading editor…
      </span>
    </div>
  ),
});

type CodeBlockProps = {
  block: DocumentBlock;
  canEdit: boolean;
  onUpdate: (patch: Partial<DocumentBlock>) => void;
};

const PREVIEW_HEIGHT = 132;

const previewEditorOptions: editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on",
  folding: true,
  fontSize: 12,
  lineHeight: 20,
  fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
  fontLigatures: true,
  padding: { top: 10, bottom: 28 },
  scrollbar: {
    vertical: "hidden",
    horizontal: "hidden",
    handleMouseWheel: false,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  renderLineHighlight: "none",
  selectionHighlight: false,
  occurrencesHighlight: "off",
  contextmenu: false,
  quickSuggestions: false,
  links: false,
  cursorStyle: "line-thin",
  cursorBlinking: "solid",
  renderValidationDecorations: "off",
  guides: { indentation: true, bracketPairs: false },
};

function overlayEditorOptions(canEdit: boolean): editor.IStandaloneEditorConstructionOptions {
  return {
    readOnly: !canEdit,
    domReadOnly: !canEdit,
    minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    folding: true,
    foldingStrategy: "auto",
    showFoldingControls: "mouseover",
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
    fontLigatures: true,
    padding: { top: 16, bottom: 16 },
    automaticLayout: true,
    wordWrap: "on",
    smoothScrolling: true,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    renderLineHighlight: canEdit ? "line" : "gutter",
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    suggestOnTriggerCharacters: canEdit,
    quickSuggestions: canEdit,
    tabSize: 2,
  };
}

function configureMonaco(monaco: Monaco) {
  registerCursorEditorTheme(monaco);
  monaco.editor.setTheme(CURSOR_EDITOR_THEME);
}

export function CodeBlock({ block, canEdit, onUpdate }: CodeBlockProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(640);
  const overlayEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const storedLanguage = block.meta?.codeLanguage as CodeLanguageId | undefined;
  const language = storedLanguage ?? detectCodeLanguage(block.content);
  const filename = languageFilename(language, block.meta?.codeFilename);
  const lineCount = countCodeLines(block.content);
  const languageLabel = CODE_LANGUAGES.find((item) => item.id === language)?.label ?? "Code";
  const isEmpty = !block.content.trim();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function syncOverlayHeight() {
      setOverlayHeight(Math.min(Math.round(window.innerHeight * 0.68), 640));
    }

    syncOverlayHeight();
    window.addEventListener("resize", syncOverlayHeight);
    return () => window.removeEventListener("resize", syncOverlayHeight);
  }, []);

  useEffect(() => {
    if (!overlayOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOverlayOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (!block.content.trim()) return;
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  }, [block.content]);

  const handleOverlayMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      overlayEditorRef.current = editorInstance;
      configureMonaco(monaco);
      applySmartCodeFolding(editorInstance, monaco);
      if (canEdit) {
        editorInstance.focus();
      }
    },
    [canEdit],
  );

  const handleContentChange = useCallback(
    (value: string | undefined) => {
      const next = value ?? "";
      const detected = detectCodeLanguage(next);
      onUpdate({
        content: next,
        meta: {
          ...block.meta,
          codeLanguage: storedLanguage ?? detected,
        },
      });
    },
    [block.meta, onUpdate, storedLanguage],
  );

  const handleLanguageChange = useCallback(
    (nextLanguage: CodeLanguageId) => {
      onUpdate({
        meta: {
          ...block.meta,
          codeLanguage: nextLanguage,
          codeFilename: undefined,
        },
      });
    },
    [block.meta, onUpdate],
  );

  const previewContent = useMemo(() => {
    if (isEmpty) {
      return canEdit
        ? "// Click to open the editor and start writing code…"
        : "// No code yet";
    }
    return block.content;
  }, [block.content, canEdit, isEmpty]);

  const previewCtaLabel = isEmpty
    ? canEdit
      ? "Open code editor"
      : "View code"
    : "Read entire code";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={isEmpty ? "Open code editor" : "Open full code view"}
        onClick={() => setOverlayOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOverlayOpen(true);
          }
        }}
        className={cn(
          "w-full max-w-2xl cursor-pointer overflow-hidden rounded-[10px] border border-[#2d2d2d]",
          "bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.22)]",
          "transition-shadow hover:shadow-[0_10px_36px_rgba(0,0,0,0.28)]",
        )}
      >
        <div className="flex items-center gap-2 border-b border-[#2d2d2d] bg-[#252526] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="ml-1 flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate font-mono text-[0.6875rem] text-[#cccccc]">{filename}</span>
            <span className="hidden text-[#555] sm:inline">·</span>
            <span className="hidden font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[#858585] sm:inline">
              {languageLabel}
            </span>
          </div>
          {lineCount > 0 ? (
            <span className="font-mono text-[0.625rem] text-[#6e7681]">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          ) : null}
        </div>

        <div
          className="relative"
          style={{ height: PREVIEW_HEIGHT }}
        >
          <MonacoEditor
            height={PREVIEW_HEIGHT}
            language={language}
            value={previewContent}
            theme={CURSOR_EDITOR_THEME}
            options={previewEditorOptions}
            beforeMount={configureMonaco}
            onMount={(editorInstance, monaco) => {
              configureMonaco(monaco);
              editorInstance.setScrollTop(0);
            }}
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[72px]"
            style={{
              background:
                "linear-gradient(to top, rgba(26,26,26,0.98) 0%, rgba(26,26,26,0.82) 38%, rgba(26,26,26,0.35) 72%, transparent 100%)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOverlayOpen(true);
              }}
              className={cn(
                "pointer-events-auto inline-flex items-center gap-1.5 rounded-full",
                "border border-white/14 bg-white/10 px-3.5 py-1.5",
                "font-mono text-[0.6875rem] font-medium tracking-wide text-white/90",
                "shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md",
                "transition-all hover:border-white/22 hover:bg-white/16 hover:text-white",
              )}
            >
              <Code2 className="size-3.5 opacity-80" strokeWidth={2} />
              {previewCtaLabel}
            </button>
          </div>
        </div>
      </div>

      {mounted && overlayOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Code editor"
            >
              <button
                type="button"
                aria-label="Close code editor"
                className="absolute inset-0 bg-[#0b1220]/50 backdrop-blur-xl"
                onClick={() => setOverlayOpen(false)}
              />

              <div
                className={cn(
                  "relative z-[1] flex w-full max-w-[min(96vw,56rem)] flex-col overflow-hidden",
                  "rounded-[16px] border border-white/18 bg-white/10 shadow-2xl backdrop-blur-2xl",
                  "max-h-[calc(100dvh-2rem)]",
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-2 border-b border-white/10 bg-[#252526]/90 px-3 py-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="size-2.5 rounded-full bg-[#febc2e]" />
                    <span className="size-2.5 rounded-full bg-[#28c840]" />
                  </div>

                  <div className="ml-1 min-w-0 flex-1">
                    <div className="truncate font-mono text-[0.75rem] text-white/90">{filename}</div>
                    <div className="font-mono text-[0.625rem] text-white/45">
                      {lineCount > 0
                        ? `${lineCount} ${lineCount === 1 ? "line" : "lines"} · ${languageLabel}`
                        : languageLabel}
                      {canEdit ? " · editable" : " · read only"}
                    </div>
                  </div>

                  {canEdit ? (
                    <select
                      value={language}
                      onChange={(event) =>
                        handleLanguageChange(event.target.value as CodeLanguageId)
                      }
                      className={cn(
                        "rounded-[6px] border border-white/12 bg-white/8 px-2 py-1",
                        "font-mono text-[0.6875rem] text-white/85 outline-none",
                        "focus:border-white/25",
                      )}
                    >
                      {CODE_LANGUAGES.map((item) => (
                        <option key={item.id} value={item.id} className="bg-[#252526]">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-[6px] border border-white/10 bg-white/6 px-2 py-1 font-mono text-[0.6875rem] text-white/70">
                      {languageLabel}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    disabled={isEmpty}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[6px] border border-white/12",
                      "bg-white/8 px-2.5 py-1.5 font-mono text-[0.6875rem] text-white/85",
                      "transition-colors hover:bg-white/14 disabled:opacity-40",
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-300" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOverlayOpen(false)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-[6px]",
                      "border border-white/12 bg-white/8 text-white/85",
                      "transition-colors hover:bg-white/14",
                    )}
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="overflow-hidden border-t border-white/8 bg-[#1a1a1a]/95">
                  <MonacoEditor
                    height={overlayHeight}
                    language={language}
                    value={block.content}
                    theme={CURSOR_EDITOR_THEME}
                    options={overlayEditorOptions(canEdit)}
                    beforeMount={configureMonaco}
                    onMount={handleOverlayMount}
                    onChange={canEdit ? handleContentChange : undefined}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
