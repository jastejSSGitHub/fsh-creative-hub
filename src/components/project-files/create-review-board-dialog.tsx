"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { AssetUploadZone } from "@/components/workspace/asset-upload-zone";
import { buttonVariants } from "@/components/ui/button";
import { createReviewBoardAction } from "@/lib/project-files/actions";
import {
  shouldShowProjectTemplateComingSoon,
  type PendingProjectTemplate,
} from "@/lib/project-files/project-templates";
import {
  initiativeNameForSection,
  SECTION_PRESETS,
  type SectionPresetId,
} from "@/lib/project-files/section-presets";
import { reviewBoardPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type SectionSelection = {
  preset: SectionPresetId;
  customName?: string;
  enabled: boolean;
};

type CreateReviewBoardDialogProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  templateContext?: PendingProjectTemplate | null;
  onUnshippedTemplateCreated?: () => void;
};

const DEFAULT_SECTIONS: SectionSelection[] = [
  { preset: "graphics", enabled: true },
  { preset: "menus", enabled: true },
  { preset: "videos", enabled: true },
];

export function CreateReviewBoardDialog({
  projectId,
  open,
  onClose,
  templateContext = null,
  onUnshippedTemplateCreated,
}: CreateReviewBoardDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [sections, setSections] = useState<SectionSelection[]>(DEFAULT_SECTIONS);
  const [customSectionName, setCustomSectionName] = useState("");
  const [includeCustom, setIncludeCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [sectionMap, setSectionMap] = useState<{ name: string; id: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setStep(1);
    setName("");
    setSections(DEFAULT_SECTIONS);
    setCustomSectionName("");
    setIncludeCustom(false);
    setError(null);
    setBoardId(null);
    setSectionMap([]);
  }

  function handleClose() {
    if (isPending) return;
    reset();
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    setName(templateContext?.title ?? "");
    setError(null);
  }, [open, templateContext?.title]);

  function toggleSection(preset: SectionPresetId) {
    setSections((prev) =>
      prev.map((s) => (s.preset === preset ? { ...s, enabled: !s.enabled } : s)),
    );
  }

  function goToUploadStep() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Review board name is required.");
      return;
    }

    const activeSections = sections.filter((s) => s.enabled);
    if (includeCustom && customSectionName.trim()) {
      activeSections.push({
        preset: "custom",
        customName: customSectionName.trim(),
        enabled: true,
      });
    }

    if (!activeSections.length) {
      setError("Pick at least one section.");
      return;
    }

    startTransition(async () => {
      const result = await createReviewBoardAction({
        projectId,
        name: trimmed,
        sections: activeSections.map((s) => ({
          preset: s.preset,
          customName: s.customName,
        })),
      });

      if (!result.ok || !result.boardId || !result.initiativeIds) {
        setError(result.ok ? "Could not create board." : result.error);
        return;
      }

      const mapped = activeSections.map((section, index) => ({
        name: initiativeNameForSection(section.preset, section.customName),
        id: result.initiativeIds![index],
      }));

      setBoardId(result.boardId);
      setSectionMap(mapped);
      setStep(2);
    });
  }

  function finish(navigate = true) {
    if (!boardId) return;
    const showComingSoon =
      templateContext &&
      shouldShowProjectTemplateComingSoon(templateContext.id);

    if (showComingSoon) {
      onUnshippedTemplateCreated?.();
      handleClose();
      router.refresh();
      return;
    }

    handleClose();

    if (navigate) {
      router.push(reviewBoardPath(projectId, boardId));
      router.refresh();
    }
  }

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title={step === 1 ? "New review board" : "Upload assets"}
      description={
        step === 1
          ? "Name your board and choose which sections to include."
          : "Drop images or videos into each section, or skip and upload later."
      }
      className="w-[min(100vw-2rem,36rem)]"
    >
      {error && (
        <p className="mb-4 rounded-md border border-hub-rejected/30 bg-hub-rejected/10 px-3.5 py-2.5 text-sm text-hub-rejected">
          {error}
        </p>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="board-name"
              className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-foreground/50"
            >
              Board name
            </label>
            <input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              placeholder="Summer Menu Review"
              className="min-h-9 w-full rounded-md border border-hub-foreground/15 bg-hub-surface px-3 py-2 text-sm text-hub-foreground outline-none ring-hub-accent/40 placeholder:text-hub-foreground/35 focus:ring-2 disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-hub-foreground/50">
              Sections
            </p>
            <div className="flex flex-wrap gap-2">
              {SECTION_PRESETS.map((preset) => {
                const selected = sections.find((s) => s.preset === preset.id)?.enabled;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleSection(preset.id)}
                    className={cn(
                      "min-h-9 rounded-md border px-3 text-sm font-medium transition-colors",
                      selected
                        ? "border-hub-foreground bg-hub-espresso text-hub-paper"
                        : "border-hub-foreground/15 bg-hub-surface text-hub-foreground/70 hover:bg-hub-foreground/5",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-hub-foreground/70">
            <input
              type="checkbox"
              checked={includeCustom}
              onChange={(e) => setIncludeCustom(e.target.checked)}
              className="size-4 rounded border-hub-foreground/20"
            />
            Add custom section
          </label>
          {includeCustom && (
            <input
              value={customSectionName}
              onChange={(e) => setCustomSectionName(e.target.value)}
              placeholder="Custom section name"
              className="min-h-9 w-full rounded-md border border-hub-foreground/15 bg-hub-surface px-3 py-2 text-sm"
            />
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-10 flex-1 rounded-md border-hub-foreground/15",
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={goToUploadStep}
              disabled={isPending}
              className={cn(
                buttonVariants(),
                "min-h-10 flex-1 rounded-md bg-hub-espresso text-hub-paper",
              )}
            >
              {isPending ? "Creating…" : "Continue"}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {sectionMap.map((section) => (
            <div key={section.id} className="space-y-2">
              <p className="font-display text-sm font-bold text-hub-foreground">
                {section.name}
              </p>
              {boardId && (
                <AssetUploadZone
                  projectId={projectId}
                  boardId={boardId}
                  initiativeId={section.id}
                  onUploaded={() => undefined}
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => finish(true)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-10 flex-1 rounded-md border-hub-foreground/15",
              )}
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => finish(true)}
              className={cn(
                buttonVariants(),
                "min-h-10 flex-1 rounded-md bg-hub-espresso text-hub-paper",
              )}
            >
              Open board
            </button>
          </div>
        </div>
      )}
    </HubDialog>
  );
}
