"use client";

import { useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import {
  hubDialogFieldClassName,
  hubDialogLabelClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { createFilterAction } from "@/lib/tasks/actions";

type FilterBuilderDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function FilterBuilderDialog({
  open,
  onClose,
  onCreated,
}: FilterBuilderDialogProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createFilterAction({ name, query });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setQuery("");
      onCreated?.();
      onClose();
    });
  }

  if (!open) return null;

  return (
    <HubDialog
      open={open}
      onClose={onClose}
      title="Create filter"
      description="Use operators: & | ! ( ) — e.g. today & @design"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-[6px] border border-hub-rejected/30 bg-hub-rejected/10 px-3 py-2 text-xs text-hub-rejected">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <label className={hubDialogLabelClassName}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={hubDialogFieldClassName}
            placeholder="My filter"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className={hubDialogLabelClassName}>Query</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={hubDialogFieldClassName}
            placeholder="today & p1"
            required
          />
        </div>
        <button type="submit" disabled={isPending} className={hubDialogPrimaryButtonClassName}>
          Save filter
        </button>
      </form>
    </HubDialog>
  );
}
