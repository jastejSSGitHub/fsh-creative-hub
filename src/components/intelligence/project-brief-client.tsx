"use client";

import { useCallback, useState } from "react";

import {
  HubIntelligenceEmptyState,
  INTELLIGENCE_PROMPTS,
  type IntelligencePrompt,
} from "@/components/hub/hub-intelligence-empty-state";
import { HubIntelligenceLoading } from "@/components/hub/hub-intelligence-loading";
import { HubIntelligenceResult } from "@/components/hub/hub-intelligence-result";
import { NavBackLink } from "@/components/ui/nav-back-link";
import type {
  BuildProgressEvent,
  IntelligenceAskResult,
  IntelligenceTemplateId,
  IntelligenceView,
  ProjectBrief,
} from "@/lib/intelligence/types";
import { projectPath } from "@/lib/routes";

type ProjectBriefClientProps = {
  projectId: string;
  projectName: string;
};

export function ProjectBriefClient({
  projectId,
  projectName,
}: ProjectBriefClientProps) {
  const [query, setQuery] = useState("");
  const [activePromptId, setActivePromptId] =
    useState<IntelligenceTemplateId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<BuildProgressEvent[]>([]);
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [view, setView] = useState<IntelligenceView | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const runIntelligence = useCallback(
    async (prompt: string, templateId?: IntelligenceTemplateId | null) => {
      setLoading(true);
      setError(null);
      setProgress([{ stage: "loading_snapshot", message: "Loading project snapshot…" }]);

      try {
        const response = await fetch("/api/intelligence/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            projectId,
            templateId: templateId ?? null,
          }),
        });

        const payload = (await response.json()) as
          | IntelligenceAskResult
          | { error?: string };

        if (!response.ok || !("ok" in payload) || !payload.ok) {
          setError(
            "error" in payload && payload.error
              ? payload.error
              : "Could not build project brief.",
          );
          return;
        }

        setBrief(payload.brief);
        setView(payload.view);
        setFromCache(payload.fromCache);
        setIsProjectAdmin(payload.isProjectAdmin);
        setProgress(payload.progress);
      } catch {
        setError("Request failed. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  const rebuildBrief = useCallback(async () => {
    if (!isProjectAdmin) return;

    setRebuilding(true);
    setError(null);
    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const payload = (await response.json()) as
        | IntelligenceAskResult
        | { error?: string };

      if (!response.ok || !("ok" in payload) || !payload.ok) {
        setError(
          "error" in payload && payload.error
            ? payload.error
            : "Rebuild failed.",
        );
        return;
      }

      setBrief(payload.brief);
      setView(payload.view);
      setFromCache(payload.fromCache);
      setProgress(payload.progress);
    } catch {
      setError("Rebuild failed.");
    } finally {
      setRebuilding(false);
    }
  }, [isProjectAdmin, projectId]);

  function handlePromptSelect(prompt: IntelligencePrompt) {
    setActivePromptId(prompt.id);
    setQuery(prompt.label);
    void runIntelligence(prompt.label, prompt.id);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <NavBackLink href={projectPath(projectId)} label={projectName} />
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-hub-foreground">
          Project intelligence
        </h1>
        <p className="mt-1 text-sm text-hub-foreground/50">
          Ask a question to get a structured summary of collaterals, reviews, and
          tasks. Nothing is generated until you ask.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void runIntelligence(query, activePromptId);
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActivePromptId(null);
            setError(null);
          }}
          placeholder="Ask about this project…"
          className="h-10 min-w-0 flex-1 rounded-xl border border-hub-foreground/10 bg-hub-surface px-3 text-sm text-hub-foreground outline-none focus:border-hub-primary/35 focus:ring-1 focus:ring-hub-primary/20"
        />
        <button
          type="submit"
          disabled={loading || (!query.trim() && !activePromptId)}
          className="shrink-0 rounded-xl bg-hub-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      {!brief && !loading && (
        <div className="rounded-2xl border border-hub-foreground/8 bg-hub-surface">
          <HubIntelligenceEmptyState
            activePromptId={activePromptId}
            expandedPromptId={null}
            showGlobalPicker={false}
            projectOptions={[]}
            projectOptionsLoading={false}
            projectOptionsError={null}
            onPromptSelect={handlePromptSelect}
            onProjectSelect={() => {}}
            projectScoped
          />
        </div>
      )}

      {loading && <HubIntelligenceLoading events={progress} />}

      {error && !loading && (
        <p className="text-sm text-hub-rejected" role="alert">
          {error}
        </p>
      )}

      {brief && view && !loading && (
        <div className="overflow-hidden rounded-2xl border border-hub-foreground/8 bg-hub-surface shadow-sm">
          <HubIntelligenceResult
            brief={brief}
            view={view}
            isProjectAdmin={isProjectAdmin}
            fromCache={fromCache}
            onRebuild={rebuildBrief}
            rebuilding={rebuilding}
          />
        </div>
      )}

      {!brief && !loading && (
        <p className="text-center text-xs text-hub-foreground/30">
          Try: {INTELLIGENCE_PROMPTS.map((prompt) => prompt.label).join(" · ")}
        </p>
      )}
    </div>
  );
}
