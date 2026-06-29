"use client";

import { History } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { HubIconToolbar } from "@/components/ui/hub-icon-toolbar";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { revisionPreviewText } from "@/lib/documents/revisions";
import {
  restoreDocumentRevisionAction,
  saveDocumentRevisionAction,
} from "@/lib/project-files/actions";
import type { DocumentRevision, TextDocumentConfig } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

type DocumentRevisionsMenuProps = {
  projectId: string;
  docId: string;
  config: TextDocumentConfig;
  editable: boolean;
  onRestore: (config: TextDocumentConfig) => void;
  onRevisionSaved: (revisions: DocumentRevision[]) => void;
};

export function DocumentRevisionsMenu({
  projectId,
  docId,
  config,
  editable,
  onRestore,
  onRevisionSaved,
}: DocumentRevisionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const revisions = config.revisions ?? [];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function saveRevision() {
    setNotice(null);
    startTransition(async () => {
      const result = await saveDocumentRevisionAction({
        projectId,
        docId,
        label: `Revision ${revisions.length + 1}`,
      });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      onRevisionSaved(result.revisions);
      setNotice("Revision saved");
      setOpen(false);
    });
  }

  function restoreRevision(revision: DocumentRevision) {
    setNotice(null);
    startTransition(async () => {
      const result = await restoreDocumentRevisionAction({
        projectId,
        docId,
        revisionId: revision.id,
      });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      onRestore(result.config);
      setNotice(`Restored ${revision.label}`);
      setOpen(false);
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <HubIconToolbar
        items={[
          {
            id: "revisions",
            label: "Version history",
            icon: History,
            onClick: () => setOpen((value) => !value),
          },
        ]}
      />

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(92vw,18rem)] overflow-hidden rounded-xl border border-hub-foreground/10 bg-hub-surface shadow-lg">
          <div className="border-b border-hub-foreground/8 px-3 py-2">
            <p className="text-xs font-semibold text-hub-foreground">Version history</p>
            <p className="mt-0.5 text-[0.625rem] text-hub-foreground/45">
              Snapshots before major edits · up to 20 saved
            </p>
          </div>

          {editable && (
            <div className="border-b border-hub-foreground/8 p-2">
              <button
                type="button"
                disabled={isPending}
                onClick={saveRevision}
                className="w-full rounded-md bg-hub-foreground/[0.06] px-2 py-1.5 text-xs font-medium text-hub-foreground transition-colors hover:bg-hub-foreground/10 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save revision"}
              </button>
            </div>
          )}

          <ul className="max-h-56 overflow-y-auto py-1">
            {revisions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-hub-foreground/45">No revisions yet</li>
            ) : (
              [...revisions].reverse().map((revision) => (
                <li key={revision.id}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => restoreRevision(revision)}
                    className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-hub-foreground/[0.04] disabled:opacity-60"
                  >
                    <span className="text-xs font-medium text-hub-foreground">
                      {revision.label}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[0.625rem] text-hub-foreground/45">
                      {revisionPreviewText(revision)}
                    </span>
                    <span className="mt-0.5 text-[0.625rem] text-hub-foreground/40">
                      {formatRelativeTime(revision.savedAt)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>

          {notice && (
            <p
              className={cn(
                "border-t border-hub-foreground/8 px-3 py-2 text-[0.625rem]",
                notice.includes("Restored") || notice.includes("saved")
                  ? "text-hub-approved"
                  : "text-hub-rejected",
              )}
            >
              {notice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
