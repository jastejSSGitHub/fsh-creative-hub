"use client";

import { Sparkles } from "lucide-react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { hubDialogPrimaryButtonClassName } from "@/lib/ui/hub-dialog-form";
import type { PendingProjectTemplate } from "@/lib/project-files/project-templates";
import { cn } from "@/lib/utils";

type TemplateComingSoonDialogProps = {
  template: PendingProjectTemplate | null;
  onClose: () => void;
};

export function TemplateComingSoonDialog({
  template,
  onClose,
}: TemplateComingSoonDialogProps) {
  return (
    <HubDialog
      open={template !== null}
      onClose={onClose}
      title="This template is coming soon"
      description="Your file was created and saved to this project."
      className="w-[min(100vw-2rem,28rem)]"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-hub-accent/25 bg-hub-accent/10 px-3.5 py-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-hub-accent/20 text-hub-foreground">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="font-display text-sm font-bold text-hub-foreground">
              {template?.title ?? "Template"}
            </p>
            <p className="text-sm leading-relaxed text-hub-foreground/65">
              The full guided experience for this template is still on the way.
              For now, review boards, open canvases, and text documents are ready
              to use from{" "}
              <span className="font-medium text-hub-foreground">Create</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={cn(hubDialogPrimaryButtonClassName, "w-full")}
        >
          Got it
        </button>
      </div>
    </HubDialog>
  );
}
