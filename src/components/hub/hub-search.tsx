"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  FileText,
  FolderKanban,
  ImageIcon,
  PenTool,
  Search,
  Sparkles,
} from "lucide-react";

import {
  HubIntelligenceEmptyState,
  INTELLIGENCE_PROMPTS,
  type IntelligencePrompt,
} from "@/components/hub/hub-intelligence-empty-state";
import { HubIntelligenceLoading } from "@/components/hub/hub-intelligence-loading";
import { HubIntelligenceResult } from "@/components/hub/hub-intelligence-result";
import {
  HubSearchEmptyState,
  type SearchHint,
  type SearchHintId,
} from "@/components/hub/hub-search-empty-state";
import { isIntelligenceIntent } from "@/lib/intelligence/intent-router";
import type {
  BuildProgressEvent,
  IntelligenceAskResult,
  IntelligenceTemplateId,
  IntelligenceView,
  ProjectBrief,
} from "@/lib/intelligence/types";
import { projectIdFromPathname } from "@/lib/routes";
import type { SearchResult } from "@/lib/search/queries";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 200;

type HubMode = "search" | "intelligence";

function ResultIcon({ result }: { result: SearchResult }) {
  if (result.kind === "project") {
    return <FolderKanban className="size-3.5 shrink-0 text-hub-primary" />;
  }
  if (result.kind === "asset") {
    return <ImageIcon className="size-3.5 shrink-0 text-amber-600" />;
  }
  if (result.kind === "task") {
    return <ClipboardList className="size-3.5 shrink-0 text-emerald-600" />;
  }
  if (result.fileType === "canvas") {
    return <PenTool className="size-3.5 shrink-0 text-purple-500" />;
  }
  if (result.fileType === "text_document") {
    return <FileText className="size-3.5 shrink-0 text-indigo-500" />;
  }
  return <ClipboardList className="size-3.5 shrink-0 text-indigo-500" />;
}

export function HubSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const projectId = projectIdFromPathname(pathname);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<HubMode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeHintId, setActiveHintId] = useState<SearchHintId | null>(null);
  const [activePromptId, setActivePromptId] =
    useState<IntelligenceTemplateId | null>(null);
  const [placeholder, setPlaceholder] = useState(
    "Search projects, files, assets, tasks",
  );

  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(
    null,
  );
  const [intelligenceProgress, setIntelligenceProgress] = useState<
    BuildProgressEvent[]
  >([]);
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [view, setView] = useState<IntelligenceView | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}`,
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setResults([]);
        setSearchError(payload?.error ?? "Search failed. Try again.");
        return;
      }
      const data = (await response.json()) as { results: SearchResult[] };
      setResults(data.results ?? []);
      setActiveIndex(data.results?.length ? 0 : -1);
    } catch {
      setResults([]);
      setSearchError("Search failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const runIntelligence = useCallback(
    async (prompt: string, templateId?: IntelligenceTemplateId | null) => {
      const trimmed = prompt.trim();
      if (!trimmed && !templateId) return;

      setIntelligenceLoading(true);
      setIntelligenceError(null);
      setIntelligenceProgress([]);
      setBrief(null);
      setView(null);

      const stagedMessages: BuildProgressEvent[] = [
        { stage: "loading_snapshot", message: "Loading project snapshot…" },
      ];
      setIntelligenceProgress(stagedMessages);

      try {
        const response = await fetch("/api/intelligence/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            projectId,
            templateId: templateId ?? null,
          }),
        });

        const payload = (await response.json()) as
          | IntelligenceAskResult
          | { error?: string };

        if (!response.ok || !("ok" in payload) || !payload.ok) {
          const error =
            "error" in payload && payload.error
              ? payload.error
              : "Could not build project brief.";
          setIntelligenceError(error);
          return;
        }

        setBrief(payload.brief);
        setView(payload.view);
        setFromCache(payload.fromCache);
        setIsProjectAdmin(payload.isProjectAdmin);
        setIntelligenceProgress(payload.progress);
      } catch {
        setIntelligenceError(
          "Intelligence request failed. Check your connection and try again.",
        );
      } finally {
        setIntelligenceLoading(false);
      }
    },
    [projectId],
  );

  const rebuildBrief = useCallback(async () => {
    if (!brief || !isProjectAdmin) return;

    setRebuilding(true);
    setIntelligenceError(null);
    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: brief.projectId }),
      });

      const payload = (await response.json()) as
        | IntelligenceAskResult
        | { error?: string };

      if (!response.ok || !("ok" in payload) || !payload.ok) {
        setIntelligenceError(
          "error" in payload && payload.error
            ? payload.error
            : "Rebuild failed.",
        );
        return;
      }

      setBrief(payload.brief);
      setView(payload.view);
      setFromCache(payload.fromCache);
      setIntelligenceProgress(payload.progress);
    } catch {
      setIntelligenceError("Rebuild failed. Try again.");
    } finally {
      setRebuilding(false);
    }
  }, [brief, isProjectAdmin]);

  useEffect(() => {
    if (mode !== "search") return;
    const trimmed = query.trim();
    if (trimmed.length < 1) return;

    if (isIntelligenceIntent(trimmed)) {
      setMode("intelligence");
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [mode, query, runSearch]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        setFocused(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function openSearchPanel() {
    setOpen(true);
    setFocused(true);
    inputRef.current?.focus();
  }

  function closeSearchPanel() {
    setOpen(false);
    setFocused(false);
    setActiveHintId(null);
    setActivePromptId(null);
    setPlaceholder(
      mode === "intelligence"
        ? "Ask about this project…"
        : "Search projects, files, assets, tasks",
    );
    inputRef.current?.blur();
  }

  function switchMode(next: HubMode) {
    setMode(next);
    setQuery("");
    setResults([]);
    setSearchError(null);
    setIntelligenceError(null);
    setBrief(null);
    setView(null);
    setActiveHintId(null);
    setActivePromptId(null);
    setPlaceholder(
      next === "intelligence"
        ? projectId
          ? "Ask about this project…"
          : "Ask about a project…"
        : "Search projects, files, assets, tasks",
    );
    setOpen(true);
    setFocused(true);
    inputRef.current?.focus();
  }

  function handleHintSelect(hint: SearchHint) {
    setActiveHintId(hint.id);
    setPlaceholder(`Try "${hint.example}"`);
    setOpen(true);
    setFocused(true);
    inputRef.current?.focus();
  }

  function handlePromptSelect(prompt: IntelligencePrompt) {
    setActivePromptId(prompt.id);
    setPlaceholder(prompt.example);
    setOpen(true);
    setFocused(true);
    void runIntelligence(prompt.label, prompt.id);
  }

  function navigateTo(result: SearchResult, newTab = false) {
    if (newTab) {
      window.open(result.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(result.href);
    }
    setQuery("");
    setResults([]);
    closeSearchPanel();
  }

  function submitIntelligence() {
    const templateId = activePromptId;
    void runIntelligence(query, templateId);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (mode === "intelligence") {
      if (event.key === "Enter") {
        event.preventDefault();
        submitIntelligence();
        return;
      }
      if (event.key === "Escape") {
        setQuery("");
        closeSearchPanel();
      }
      return;
    }

    if (!open || results.length === 0) {
      if (event.key === "Escape") {
        setQuery("");
        closeSearchPanel();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? results.length - 1 : index - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      navigateTo(results[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      setFocused(false);
    }
  }

  const trimmedQuery = query.trim();
  const showEmptyState = open && trimmedQuery.length === 0 && !brief && !intelligenceLoading;
  const showSearchResults =
    mode === "search" && open && trimmedQuery.length > 0;
  const showIntelligencePanel =
    mode === "intelligence" &&
    open &&
    (intelligenceLoading || intelligenceError || brief != null);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div
        className="relative"
        onPointerDown={(event) => {
          if (event.target === inputRef.current) return;
          event.preventDefault();
          openSearchPanel();
        }}
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/40"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (mode === "search") {
              if (!value.trim()) {
                setResults([]);
                setSearchError(null);
                if (focused) setOpen(true);
              } else {
                setActiveHintId(null);
                setPlaceholder("Search projects, files, assets, tasks");
                setOpen(true);
              }
            } else {
              setActivePromptId(null);
              setIntelligenceError(null);
              if (focused) setOpen(true);
            }
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (next && containerRef.current?.contains(next)) return;
            setFocused(false);
            if (!query.trim() && !brief) {
              setOpen(false);
              setActiveHintId(null);
              setActivePromptId(null);
              setPlaceholder(
                mode === "intelligence"
                  ? "Ask about this project…"
                  : "Search projects, files, assets, tasks",
              );
            }
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          aria-label={
            mode === "intelligence"
              ? "Ask AI about a project"
              : "Search projects, files, assets, and tasks"
          }
          aria-expanded={Boolean(
            showEmptyState || showSearchResults || showIntelligencePanel,
          )}
          aria-controls={showSearchResults ? listboxId : undefined}
          aria-autocomplete="list"
          role="combobox"
          className={cn(
            "h-8 w-full rounded-full border border-white/14 bg-white/14 pr-14 pl-9 text-sm text-white placeholder:text-white/40 outline-none transition-[border-color,background-color,box-shadow] focus:border-hub-primary/40 focus:bg-white/18 focus:ring-1 focus:ring-hub-primary/25",
            (showEmptyState || mode === "intelligence") &&
              "border-hub-primary/30 bg-white/16 ring-1 ring-hub-primary/20",
          )}
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-white/14 bg-white/10 px-1.5 py-0.5 font-mono text-[0.58rem] text-white/35 sm:inline">
          Ctrl K
        </kbd>
      </div>

      {open && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface shadow-[0_16px_48px_rgba(11,11,11,0.18)] animate-in fade-in slide-in-from-top-1 duration-200"
          role="presentation"
        >
          <div className="flex border-b border-hub-foreground/6 p-1">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => switchMode("search")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                mode === "search"
                  ? "bg-hub-foreground/[0.05] text-hub-foreground"
                  : "text-hub-foreground/45 hover:text-hub-foreground/65",
              )}
            >
              <Search className="size-3" />
              Search
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => switchMode("intelligence")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                mode === "intelligence"
                  ? "bg-hub-primary/10 text-hub-primary"
                  : "text-hub-foreground/45 hover:text-hub-foreground/65",
              )}
            >
              <Sparkles className="size-3" />
              Ask AI
            </button>
          </div>

          {showEmptyState && mode === "search" && (
            <HubSearchEmptyState
              activeHintId={activeHintId}
              onHintSelect={handleHintSelect}
            />
          )}

          {showEmptyState && mode === "intelligence" && (
            <HubIntelligenceEmptyState
              activePromptId={activePromptId}
              onPromptSelect={handlePromptSelect}
              projectScoped={Boolean(projectId)}
            />
          )}

          {showSearchResults && (
            <>
              {loading && results.length === 0 && !searchError ? (
                <p className="px-3 py-3 text-sm text-hub-foreground/45">
                  Searching…
                </p>
              ) : searchError ? (
                <p className="px-3 py-3 text-sm text-hub-rejected">{searchError}</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-3 text-sm text-hub-foreground/45">
                  No matches for &ldquo;{trimmedQuery}&rdquo;
                </p>
              ) : (
                <ul
                  id={listboxId}
                  role="listbox"
                  className="max-h-72 overflow-y-auto py-1"
                >
                  {results.map((result, index) => (
                    <li
                      key={result.id}
                      role="option"
                      aria-selected={index === activeIndex}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => navigateTo(result)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                          index === activeIndex
                            ? "bg-hub-primary/8"
                            : "hover:bg-hub-foreground/[0.03]",
                        )}
                      >
                        <ResultIcon result={result} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-hub-foreground">
                            {result.name}
                          </span>
                          <span className="block truncate text-xs text-hub-foreground/45">
                            {result.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {showIntelligencePanel && (
            <>
              {intelligenceLoading && (
                <HubIntelligenceLoading events={intelligenceProgress} />
              )}
              {intelligenceError && !intelligenceLoading && (
                <p className="px-3 py-3 text-sm text-hub-rejected">
                  {intelligenceError}
                </p>
              )}
              {brief && view && !intelligenceLoading && (
                <HubIntelligenceResult
                  brief={brief}
                  view={view}
                  isProjectAdmin={isProjectAdmin}
                  fromCache={fromCache}
                  onRebuild={rebuildBrief}
                  rebuilding={rebuilding}
                  compact
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
