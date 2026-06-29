"use client";

import { Check, Copy, Link2, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { HubConfirmDialog } from "@/components/ui/hub-confirm-dialog";
import {
  createShareLinkAction,
  revokeShareLinkAction,
  rotateShareLinkAction,
} from "@/lib/share/actions";
import { getShareLinksForScope } from "@/lib/share/queries";
import {
  createMockShareLink,
  getMockShareLinks,
  isMockDemoId,
  isMockProjectId,
  revokeMockShareLink,
  rotateMockShareLink,
} from "@/lib/dev-tools/mock-collaboration-data";
import { readMockCollaborationData } from "@/lib/dev-tools/storage";
import {
  SHARE_EXPIRY_OPTIONS,
  shareUrl,
  type ShareExpiryOptionId,
} from "@/lib/share/types";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/client";
import {
  hubDialogCancelButtonClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import type { HubShareLink, ShareLinkScopeType } from "@/types/database";
import { cn } from "@/lib/utils";

type ShareLinkDialogProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  userId?: string;
  scopeType: ShareLinkScopeType;
  scopeId: string;
  defaultLabel?: string;
  assetIds?: string[];
  showCommentsToggle?: boolean;
};

export function ShareLinkDialog({
  open,
  onClose,
  projectId,
  userId,
  scopeType,
  scopeId,
  defaultLabel,
  assetIds,
  showCommentsToggle = false,
}: ShareLinkDialogProps) {
  const [expiry, setExpiry] = useState<ShareExpiryOptionId>("30d");
  const [showComments, setShowComments] = useState(false);
  const [label, setLabel] = useState(defaultLabel ?? "");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<HubShareLink[]>([]);
  const [revokeTarget, setRevokeTarget] = useState<HubShareLink | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadLinks = useCallback(async () => {
    if (readMockCollaborationData() && isMockProjectId(projectId)) {
      setLinks(
        getMockShareLinks(projectId, scopeType, scopeId, userId ?? "mock-user"),
      );
      return;
    }

    const supabase = createClient();
    const data = await getShareLinksForScope(supabase, projectId, scopeType, scopeId);
    setLinks(data);
  }, [projectId, scopeId, scopeType, userId]);

  useEffect(() => {
    if (!open) return;
    setCreatedUrl(null);
    setCopied(false);
    setError(null);
    setLabel(defaultLabel ?? "");
    void loadLinks();
  }, [open, defaultLabel, loadLinks]);

  function handleCreate() {
    setError(null);
    const option = SHARE_EXPIRY_OPTIONS.find((o) => o.id === expiry);
    const expiresAt =
      option?.days == null
        ? null
        : new Date(Date.now() + option.days * 86_400_000).toISOString();

    startTransition(async () => {
      if (readMockCollaborationData() && isMockProjectId(projectId)) {
        const link = createMockShareLink({
          projectId,
          scopeType,
          scopeId,
          createdBy: userId ?? "mock-user",
          label: label.trim() || defaultLabel,
          showComments: showCommentsToggle ? showComments : undefined,
          assetIds: assetIds?.length ? assetIds : undefined,
          expiresAt,
        });
        setCreatedUrl(shareUrl(link.token, getSiteUrl()));
        await loadLinks();
        return;
      }

      const result = await createShareLinkAction({
        projectId,
        scopeType,
        scopeId,
        expiresAt,
        config: {
          label: label.trim() || defaultLabel,
          showComments: showCommentsToggle ? showComments : undefined,
          assetIds: assetIds?.length ? assetIds : undefined,
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.token) {
        setCreatedUrl(shareUrl(result.token, getSiteUrl()));
      }
      await loadLinks();
    });
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the link and copy manually.");
    }
  }

  function handleRevoke() {
    if (!revokeTarget) return;
    startTransition(async () => {
      if (readMockCollaborationData() && isMockDemoId(revokeTarget.id)) {
        revokeMockShareLink(revokeTarget.id);
        setRevokeTarget(null);
        if (createdUrl?.includes(revokeTarget.token)) {
          setCreatedUrl(null);
        }
        await loadLinks();
        return;
      }

      const result = await revokeShareLinkAction(revokeTarget.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRevokeTarget(null);
      if (createdUrl?.includes(revokeTarget.token)) {
        setCreatedUrl(null);
      }
      await loadLinks();
    });
  }

  function handleRotate(link: HubShareLink) {
    startTransition(async () => {
      if (readMockCollaborationData() && isMockDemoId(link.id)) {
        const newToken = rotateMockShareLink(link, userId ?? "mock-user");
        if (newToken) {
          setCreatedUrl(shareUrl(newToken, getSiteUrl()));
        }
        await loadLinks();
        return;
      }

      const result = await rotateShareLinkAction(link.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.token) {
        setCreatedUrl(shareUrl(result.token, getSiteUrl()));
      }
      await loadLinks();
    });
  }

  return (
    <>
      <HubDialog
        open={open}
        onClose={onClose}
        title="Share with the room"
        className="w-[min(100vw-2rem,28rem)]"
      >
        <p className="text-[0.8125rem] leading-relaxed text-hub-foreground/70">
          Anyone with the link can view — no FSH account needed.
        </p>

        {error && (
          <p className="mt-3 rounded-[6px] border border-hub-rejected/30 bg-hub-rejected/10 px-3 py-2 text-xs text-hub-rejected">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-[0.6875rem] font-medium text-hub-foreground/45">
              Link name
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={defaultLabel ?? "Round 2 reel"}
              className="w-full rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-2.5 py-1.5 text-[0.8125rem] text-hub-foreground outline-none ring-[#18a0fb]/40 focus:border-[#18a0fb]/50 focus:ring-1"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[0.6875rem] font-medium text-hub-foreground/45">
              Link expires
            </span>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as ShareExpiryOptionId)}
              className="w-full rounded-[6px] border border-hub-foreground/12 bg-hub-surface px-2.5 py-1.5 text-[0.8125rem] text-hub-foreground outline-none focus:border-[#18a0fb]/50 focus:ring-1 focus:ring-[#18a0fb]/40"
            >
              {SHARE_EXPIRY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {showCommentsToggle && (
            <label className="flex items-center gap-2 text-[0.8125rem] text-hub-foreground">
              <input
                type="checkbox"
                checked={showComments}
                onChange={(e) => setShowComments(e.target.checked)}
                className="size-3.5 rounded border-hub-foreground/20"
              />
              Show approved comments (read-only)
            </label>
          )}
        </div>

        {createdUrl && (
          <div className="mt-4 rounded-[6px] border border-hub-foreground/10 bg-hub-surface px-3 py-2.5">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-hub-foreground/45">
              Client share
            </p>
            <p className="mt-1 break-all text-[0.75rem] text-hub-foreground">{createdUrl}</p>
            <button
              type="button"
              onClick={() => void copyUrl(createdUrl)}
              className={cn(
                hubDialogPrimaryButtonClassName,
                "mt-2 inline-flex items-center gap-1.5",
              )}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={hubDialogCancelButtonClassName}>
            Done
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleCreate}
            className={cn(hubDialogPrimaryButtonClassName, "inline-flex items-center gap-1.5")}
          >
            <Link2 className="size-3.5" />
            {isPending ? "Creating…" : createdUrl ? "New link" : "Copy link"}
          </button>
        </div>

        {links.length > 0 && (
          <div className="mt-5 border-t border-hub-foreground/10 pt-4">
            <p className="text-[0.6875rem] font-medium text-hub-foreground/45">Active links</p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {links.map((link) => {
                const url = shareUrl(link.token, getSiteUrl());
                const linkLabel =
                  (link.config as { label?: string }).label ??
                  defaultLabel ??
                  link.scope_type;
                return (
                  <li
                    key={link.id}
                    className="flex items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 hover:bg-hub-foreground/[0.04]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] text-hub-foreground">{linkLabel}</p>
                      <p className="text-[0.6875rem] text-hub-foreground/45">
                        {link.view_count} view{link.view_count === 1 ? "" : "s"}
                        {link.expires_at
                          ? ` · expires ${new Date(link.expires_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        title="Copy"
                        onClick={() => void copyUrl(url)}
                        className="rounded-[6px] p-1 text-hub-foreground/50 hover:bg-hub-foreground/[0.06] hover:text-hub-foreground"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Rotate token"
                        disabled={isPending}
                        onClick={() => handleRotate(link)}
                        className="rounded-[6px] p-1 text-hub-foreground/50 hover:bg-hub-foreground/[0.06] hover:text-hub-foreground disabled:opacity-50"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Revoke"
                        disabled={isPending}
                        onClick={() => setRevokeTarget(link)}
                        className="rounded-[6px] p-1 text-hub-rejected/70 hover:bg-hub-rejected/10 hover:text-hub-rejected disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </HubDialog>

      <HubConfirmDialog
        open={revokeTarget != null}
        title="Revoke share link?"
        description="Anyone with this link will lose access immediately."
        confirmLabel="Revoke link"
        tone="danger"
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </>
  );
}
