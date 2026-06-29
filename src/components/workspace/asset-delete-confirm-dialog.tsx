"use client";

import { HubConfirmDialog } from "@/components/ui/hub-confirm-dialog";

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
    <HubConfirmDialog
      open={open}
      title="Delete asset"
      description={
        <>
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
        </>
      }
      confirmLabel="Delete"
      tone="danger"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
