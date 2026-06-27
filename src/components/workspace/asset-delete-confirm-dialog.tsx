"use client";

import { HubDialog } from "@/components/projects/hub-dialog";

type AssetDeleteConfirmDialogProps = {
  open: boolean;
  assetName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function AssetDeleteConfirmDialog({
  open,
  assetName,
  onClose,
  onConfirm,
}: AssetDeleteConfirmDialogProps) {
  return (
    <HubDialog open={open} onClose={onClose} title="Delete asset">
      <p className="text-[0.8125rem] leading-relaxed text-hub-foreground/80">
        Are you sure you want to delete
        {assetName ? (
          <>
            {" "}
            <span className="font-medium text-hub-foreground">{assetName}</span>
          </>
        ) : (
          " this asset"
        )}
        ?
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[6px] px-2.5 py-1.5 text-[0.8125rem] text-hub-foreground/70 transition-colors hover:bg-hub-foreground/[0.05]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-[6px] bg-hub-rejected px-2.5 py-1.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-hub-rejected/90"
        >
          Delete
        </button>
      </div>
    </HubDialog>
  );
}
