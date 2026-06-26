"use client";

import {
  Download,
  Link2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { BlockEditor } from "@/components/documents/block-editor/block-editor";
import {
  defaultCover,
  DocumentCoverBanner,
} from "@/components/documents/document-cover";
import {
  DocumentIconButton,
  DocumentIconPicker,
} from "@/components/documents/document-icon-picker";
import { DocumentBreadcrumbs } from "@/components/documents/document-breadcrumbs";
import { DocumentScrollSpy } from "@/components/documents/document-scroll-spy";
import { HubIconToolbar } from "@/components/ui/hub-icon-toolbar";
import { HubSplitButton } from "@/components/ui/hub-split-button";
import { NavBackLink } from "@/components/ui/nav-back-link";
import { downloadMarkdown } from "@/lib/documents/markdown";
import {
  defaultDocumentCover,
  defaultDocumentIcon,
  shouldApplyLegacyDocumentDefaults,
} from "@/lib/documents/defaults";
import {
  buildPlainTextPreview,
  createBlock,
  parseDocumentConfig,
  type TextDocumentConfig,
} from "@/lib/documents/types";
import { updateTextDocumentAction } from "@/lib/project-files/actions";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import { canEdit } from "@/lib/permissions";
import { projectPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { HubProject, HubProjectFile, HubRole } from "@/types/database";

type TextDocumentWorkspaceProps = {
  project: HubProject;
  document: HubProjectFile;
  role: HubRole;
  siblingDocs: ProjectFileWithMeta[];
};

export function TextDocumentWorkspace({
  project,
  document: doc,
  role,
  siblingDocs,
}: TextDocumentWorkspaceProps) {
  const editable = canEdit(role);
  const [title, setTitle] = useState(doc.name);
  const [config, setConfig] = useState<TextDocumentConfig>(() => {
    const parsed = parseDocumentConfig(doc.config);
    if (!shouldApplyLegacyDocumentDefaults(parsed)) return parsed;

    return {
      ...parsed,
      cover: defaultDocumentCover(),
      icon: defaultDocumentIcon(),
    };
  });
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [titleHovered, setTitleHovered] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [newBlockMenuOpen, setNewBlockMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const titleAreaRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<number | null>(null);
  const legacyMigratedRef = useRef(false);

  const linkedPages = siblingDocs
    .filter((f) => f.id !== doc.id && f.type === "text_document")
    .map((f) => ({ id: f.id, name: f.name }));

  const persist = useCallback(
    (nextTitle: string, nextConfig: TextDocumentConfig) => {
      if (!editable) return;

      setSaveState("saving");

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        startTransition(async () => {
          const preview = buildPlainTextPreview(nextConfig.blocks, nextTitle);
          const payload: TextDocumentConfig = { ...nextConfig, plainTextPreview: preview };

          const result = await updateTextDocumentAction({
            projectId: project.id,
            docId: doc.id,
            name: nextTitle,
            config: payload as unknown as Record<string, unknown>,
          });

          setSaveState(result.ok ? "saved" : "idle");
        });
      }, 600);
    },
    [doc.id, editable, project.id],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (legacyMigratedRef.current || !editable) return;

    const parsed = parseDocumentConfig(doc.config);
    if (!shouldApplyLegacyDocumentDefaults(parsed)) return;

    legacyMigratedRef.current = true;
    persist(doc.name, {
      ...parsed,
      cover: defaultDocumentCover(),
      icon: defaultDocumentIcon(),
    });
  }, [doc.config, doc.name, editable, persist]);

  function updateConfig(next: TextDocumentConfig) {
    setConfig(next);
    persist(title, next);
  }

  function updateTitle(next: string) {
    setTitle(next);
    persist(next, config);
  }

  return (
    <div className="relative min-h-[100dvh] pb-24">
      <header className="sticky top-0 z-40 border-b border-hub-foreground/8 bg-hub-paper/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <NavBackLink
              href={projectPath(project.id)}
              label="Exit document"
              className="max-w-none shrink-0"
            />

            <div className="hidden h-5 w-px shrink-0 bg-hub-foreground/12 sm:block" aria-hidden />

            <DocumentBreadcrumbs
              projectId={project.id}
              projectName={project.name}
              trail={[]}
              current={{
                id: doc.id,
                name: title.trim() || "Untitled",
                icon: config.icon,
              }}
              className="min-w-0 flex-1"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[0.6875rem] text-hub-foreground/45 sm:inline">
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved"
                  : "Edited recently"}
            </span>

            <HubIconToolbar
              items={[
                {
                  id: "search",
                  label: "Search in document",
                  icon: Search,
                  onClick: () => {
                    window.getSelection()?.removeAllRanges();
                  },
                },
                {
                  id: "export",
                  label: "Export as Markdown",
                  icon: Download,
                  onClick: () => downloadMarkdown(title, config),
                },
                {
                  id: "copy-link",
                  label: "Copy link",
                  icon: Link2,
                  onClick: () => {
                    void navigator.clipboard.writeText(window.location.href);
                  },
                },
                {
                  id: "settings",
                  label: "Page settings",
                  icon: SlidersHorizontal,
                },
              ]}
            />

            {editable ? (
              <HubSplitButton
                label="New block"
                onPrimaryClick={() => {
                  const last = config.blocks[config.blocks.length - 1];
                  if (last) {
                    updateConfig({
                      ...config,
                      blocks: [...config.blocks, createBlock("paragraph")],
                    });
                  }
                }}
                onMenuClick={() => setNewBlockMenuOpen((o) => !o)}
                menuOpen={newBlockMenuOpen}
                menuContent={
                  <>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-[0.8125rem] hover:bg-hub-foreground/[0.04]"
                      onClick={() => {
                        downloadMarkdown(title, config);
                        setNewBlockMenuOpen(false);
                      }}
                    >
                      Export Markdown
                    </button>
                  </>
                }
              />
            ) : null}
          </div>
        </div>
      </header>

      <DocumentCoverBanner
        cover={config.cover}
        canEdit={editable}
        onChange={(cover) => updateConfig({ ...config, cover })}
      />

      <div className="mx-auto max-w-[52rem] px-4 sm:px-6">
        <div
          ref={titleAreaRef}
          className={cn(
            "relative",
            config.cover ? "-mt-10 pt-2" : "pt-6",
          )}
          onMouseEnter={() => setTitleHovered(true)}
          onMouseLeave={() => setTitleHovered(false)}
        >
          {editable ? (
            <div className="mb-2 h-7 shrink-0" aria-hidden={!titleHovered}>
              <div
                className={cn(
                  "flex h-full items-center gap-2 transition-opacity duration-150",
                  titleHovered
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0",
                )}
              >
                <button
                  type="button"
                  onClick={() => setIconPickerOpen(true)}
                  className="rounded-[6px] px-2 py-1 text-[0.75rem] text-hub-foreground/45 transition-colors hover:bg-hub-foreground/[0.05] hover:text-hub-foreground"
                >
                  {config.icon ? "Change icon" : "Add icon"}
                </button>
                {!config.cover ? (
                  <button
                    type="button"
                    onClick={() => updateConfig({ ...config, cover: defaultCover() })}
                    className="rounded-[6px] px-2 py-1 text-[0.75rem] text-hub-foreground/45 transition-colors hover:bg-hub-foreground/[0.05] hover:text-hub-foreground"
                  >
                    Add cover
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="relative">
            {config.icon ? (
              <DocumentIconButton
                icon={config.icon}
                onClick={editable ? () => setIconPickerOpen(true) : undefined}
                className={cn(
                  "absolute left-0 z-10",
                  config.cover ? "bottom-full translate-y-7" : "bottom-full translate-y-1",
                )}
              />
            ) : null}

            <textarea
              value={title}
              readOnly={!editable}
              placeholder="Untitled"
              rows={1}
              onChange={(e) => {
                updateTitle(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full resize-none overflow-hidden bg-transparent font-display text-[2.5rem] font-extrabold leading-tight tracking-tight text-hub-foreground outline-none placeholder:text-hub-foreground/25"
            />
          </div>
        </div>

        <div className="mt-4">
          <BlockEditor
            blocks={config.blocks}
            onChange={(blocks) => updateConfig({ ...config, blocks })}
            canEdit={editable}
            projectId={project.id}
            linkedPages={linkedPages}
            onHeadingsChange={setHeadings}
          />
        </div>
      </div>

      <DocumentScrollSpy headings={headings} />

      <DocumentIconPicker
        icon={config.icon}
        onChange={(icon) => updateConfig({ ...config, icon })}
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        anchorRef={titleAreaRef}
      />
    </div>
  );
}
