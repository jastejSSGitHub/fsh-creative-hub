"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileText, FolderKanban, ImageIcon, PenTool, Search } from "lucide-react";

import type { SearchResult } from "@/lib/search/queries";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 200;

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
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

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

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) return;

    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
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
        setOpen(Boolean(query.trim()));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query]);

  function navigateTo(result: SearchResult, newTab = false) {
    if (newTab) {
      window.open(result.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(result.href);
    }
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (event.key === "Escape") {
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
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
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
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
            if (!value.trim()) {
              setResults([]);
              setOpen(false);
              setSearchError(null);
            } else {
              setOpen(true);
            }
          }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search projects, files, assets, tasks"
          aria-label="Search projects, files, assets, and tasks"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-autocomplete="list"
          role="combobox"
          className="h-8 w-full rounded-full border border-white/14 bg-white/14 pr-14 pl-9 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-hub-primary/40 focus:bg-white/18 focus:ring-1 focus:ring-hub-primary/25"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-white/14 bg-white/10 px-1.5 py-0.5 font-mono text-[0.58rem] text-white/35 sm:inline">
          Ctrl K
        </kbd>
      </div>

      {showDropdown && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface shadow-[0_16px_48px_rgba(11,11,11,0.18)]"
          role="presentation"
        >
          {loading && results.length === 0 && !searchError ? (
            <p className="px-3 py-3 text-sm text-hub-foreground/45">Searching…</p>
          ) : searchError ? (
            <p className="px-3 py-3 text-sm text-hub-rejected">{searchError}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-hub-foreground/45">
              No matches for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto py-1">
              {results.map((result, index) => (
                <li key={result.id} role="option" aria-selected={index === activeIndex}>
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
        </div>
      )}
    </div>
  );
}
