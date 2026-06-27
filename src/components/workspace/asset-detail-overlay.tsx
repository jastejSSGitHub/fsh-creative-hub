"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { MentionComposer } from "@/components/workspace/mention-composer";
import { ConsensusBar } from "@/components/workspace/consensus-bar";
import { STATUS_STYLES } from "@/components/workspace/asset-status";
import {
  CommentsListSkeleton,
} from "@/components/workspace/asset-overlay-skeleton";
import { CommentOptionsMenu } from "@/components/workspace/comment-options-menu";
import { CommentsEmptyState } from "@/components/workspace/comments-empty-state";
import {
  ReactionPicker,
  applyOptimisticVote,
} from "@/components/workspace/reaction-picker";
import { UndoToast } from "@/components/ui/undo-toast";
import { buttonVariants } from "@/components/ui/button";
import { parseMentionIds } from "@/lib/mentions/utils";
import { canAdmin, canEdit } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import {
  removeCommentFromTree,
  restoreCommentToTree,
} from "@/lib/workspace/comment-tree";
import {
  addCommentAction,
  deleteCommentAction,
  resolveCommentAction,
  toggleVoteAction,
  updateAssetStatusAction,
} from "@/lib/workspace/actions";
import {
  getAssetDetail,
  getCommentsForAsset,
  getUserReaction,
  type CommentWithAuthor,
} from "@/lib/workspace/queries";
import type { AssetWithVotes } from "@/lib/workspace/queries";
import type { HubProfile, HubRole, VoteReaction } from "@/types/database";
import { cn } from "@/lib/utils";

type AssetDetailOverlayProps = {
  asset: AssetWithVotes;
  initialComments?: CommentWithAuthor[];
  members: HubProfile[];
  role: HubRole;
  userId: string;
  onClose: () => void;
  onAssetChange?: (asset: AssetWithVotes) => void;
};

const DELETE_UNDO_MS = 5000;

type PendingCommentDelete = {
  comment: CommentWithAuthor;
  timeoutId: ReturnType<typeof setTimeout>;
};

export function AssetDetailOverlay({
  asset: initialAsset,
  initialComments = [],
  members,
  role,
  userId,
  onClose,
  onAssetChange,
}: AssetDetailOverlayProps) {
  const [asset, setAsset] = useState(initialAsset);
  const [comments, setComments] = useState(initialComments);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteToastVisible, setDeleteToastVisible] = useState(false);
  const pendingDeleteRef = useRef<PendingCommentDelete | null>(null);
  const voteSyncBlockedRef = useRef(false);
  const onAssetChangeRef = useRef(onAssetChange);
  onAssetChangeRef.current = onAssetChange;

  const userReaction = getUserReaction(asset.votes, userId);
  const statusStyle = STATUS_STYLES[asset.status];
  const votingClosed = asset.status === "final";

  useEffect(() => {
    voteSyncBlockedRef.current = false;
    setAsset(initialAsset);
    setMediaLoaded(false);
  }, [initialAsset.id]);

  const loadComments = useCallback(async () => {
    const supabase = createClient();
    const data = await getCommentsForAsset(supabase, initialAsset.id);
    setComments(data);
  }, [initialAsset.id]);

  const syncAssetFromServer = useCallback(async () => {
    const supabase = createClient();
    const next = await getAssetDetail(supabase, asset.id);
    if (!next) return;

    voteSyncBlockedRef.current = false;
    setAsset(next);
    onAssetChangeRef.current?.(next);
  }, [asset.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialComments() {
      setCommentsLoading(true);
      try {
        const supabase = createClient();
        const data = await getCommentsForAsset(supabase, initialAsset.id);
        if (!cancelled) {
          setComments(data);
        }
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    }

    void loadInitialComments();

    return () => {
      cancelled = true;
    };
  }, [initialAsset.id]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`asset-${asset.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hub_votes", filter: `asset_id=eq.${asset.id}` },
        () => {
          if (voteSyncBlockedRef.current) return;
          void syncAssetFromServer();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hub_comments", filter: `asset_id=eq.${asset.id}` },
        () => {
          void loadComments();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "hub_comments", filter: `asset_id=eq.${asset.id}` },
        () => {
          void loadComments();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "hub_comments", filter: `asset_id=eq.${asset.id}` },
        () => {
          void loadComments();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [asset.id, loadComments, syncAssetFromServer]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    return () => {
      const pending = pendingDeleteRef.current;
      if (!pending) return;

      clearTimeout(pending.timeoutId);
      pendingDeleteRef.current = null;
      void deleteCommentAction(pending.comment.id);
    };
  }, []);

  const commitPendingDelete = useCallback(async (options?: { keepToast?: boolean }) => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingDeleteRef.current = null;
    if (!options?.keepToast) {
      setDeleteToastVisible(false);
    }

    const result = await deleteCommentAction(pending.comment.id);
    if (!result.ok) {
      setComments((current) =>
        restoreCommentToTree(current, pending.comment),
      );
      setError(result.error);
      return;
    }
  }, []);

  function queueCommentDelete(comment: CommentWithAuthor) {
    void commitPendingDelete({ keepToast: true });

    setComments((current) => removeCommentFromTree(current, comment.id));
    setDeleteToastVisible(true);

    const timeoutId = setTimeout(() => {
      void commitPendingDelete();
    }, DELETE_UNDO_MS);

    pendingDeleteRef.current = { comment, timeoutId };
  }

  function undoCommentDelete() {
    const pending = pendingDeleteRef.current;
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingDeleteRef.current = null;
    setDeleteToastVisible(false);
    setComments((current) => restoreCommentToTree(current, pending.comment));
  }

  function handleVote(reaction: VoteReaction) {
    setError(null);
    const optimistic = applyOptimisticVote(asset.votes, userId, asset.id, reaction);
    voteSyncBlockedRef.current = true;
    setAsset((prev) => ({ ...prev, ...optimistic }));

    startTransition(async () => {
      const result = await toggleVoteAction(asset.id, reaction);
      if (!result.ok) {
        setError(result.error);
        voteSyncBlockedRef.current = false;
        setAsset(initialAsset);
        return;
      }

      await syncAssetFromServer();
    });
  }

  function handleStatus(status: "approved" | "rejected" | "final" | "pending") {
    startTransition(async () => {
      const result = await updateAssetStatusAction(asset.id, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      await syncAssetFromServer();
    });
  }

  function submitComment() {
    const trimmed = body.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await addCommentAction({
        assetId: asset.id,
        body: trimmed,
        parentId: replyTo,
        mentions: parseMentionIds(trimmed, members),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setReplyTo(null);
      await loadComments();
    });
  }

  function toggleResolve(commentId: string, resolved: boolean) {
    startTransition(async () => {
      await resolveCommentAction(commentId, resolved);
      await loadComments();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-hub-foreground/90 p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="mx-auto flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-hub-paper shadow-2xl sm:h-full sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl animate-in zoom-in-95 duration-200">
        <header className="flex shrink-0 items-center justify-between border-b border-hub-foreground/10 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="min-w-0 flex-1 pr-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-hub-foreground/45">
              {asset.tag} · {statusStyle.label}
            </p>
            <h2 className="truncate font-display text-lg font-extrabold text-hub-foreground sm:text-2xl">
              {asset.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-hub-foreground/15 text-hub-foreground/60 transition-colors hover:bg-hub-foreground/5 hover:text-hub-foreground sm:size-10"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="relative flex max-h-[45vh] shrink-0 items-center justify-center bg-hub-espresso p-3 sm:max-h-[50vh] sm:p-4 lg:max-h-none lg:min-h-0 lg:flex-1">
            {!mediaLoaded && (
              <div className="absolute inset-3 animate-pulse rounded-md bg-hub-skeleton-strong sm:inset-4" />
            )}
            {asset.type === "video" ? (
              <video
                src={asset.public_url}
                controls
                playsInline
                onLoadedData={() => setMediaLoaded(true)}
                className={cn(
                  "max-h-full max-w-full rounded-md transition-opacity duration-300",
                  mediaLoaded ? "opacity-100" : "opacity-0",
                )}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.public_url}
                alt={asset.name}
                onLoad={() => setMediaLoaded(true)}
                className={cn(
                  "max-h-full max-w-full rounded-md object-contain transition-opacity duration-300",
                  mediaLoaded ? "opacity-100" : "opacity-0",
                )}
              />
            )}
          </div>

          <aside className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-hub-foreground/10 lg:w-[22rem] lg:flex-none lg:border-l lg:border-t-0">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-6">
              <div className="flex min-h-0 flex-1 flex-col space-y-4 sm:space-y-5">
                {error && (
                  <p className="shrink-0 rounded-md border border-hub-rejected/30 bg-hub-rejected/10 px-3 py-2 text-sm text-hub-rejected">
                    {error}
                  </p>
                )}

                {canEdit(role) && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPending || asset.status === "final"}
                      onClick={() => handleStatus("approved")}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10 flex-1 rounded-md border-hub-approved/40 sm:flex-none")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isPending || asset.status === "final"}
                      onClick={() => handleStatus("rejected")}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10 flex-1 rounded-md border-hub-rejected/40 sm:flex-none")}
                    >
                      Reject
                    </button>
                    {canAdmin(role) && asset.status !== "final" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatus("final")}
                        className={cn(buttonVariants({ size: "sm" }), "min-h-10 w-full rounded-md bg-hub-final text-hub-foreground sm:w-auto")}
                      >
                        Final pick
                      </button>
                    )}
                  </div>
                )}

                <div className="shrink-0 space-y-2">
                  <p className="font-mono text-[0.65rem] uppercase tracking-wider text-hub-foreground/45">
                    Reactions
                  </p>
                  <ReactionPicker
                    userReaction={userReaction}
                    disabled={isPending || votingClosed}
                    onReact={handleVote}
                  />
                  <ConsensusBar counts={asset.consensus} size="md" />
                </div>

                <div className="flex min-h-0 flex-1 flex-col space-y-3">
                  <p className="shrink-0 font-mono text-[0.65rem] uppercase tracking-wider text-hub-foreground/45">
                    Comments
                  </p>
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 lg:max-h-none">
                    {commentsLoading ? (
                      <CommentsListSkeleton />
                    ) : comments.length === 0 ? (
                      <CommentsEmptyState />
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <CommentBlock
                            key={comment.id}
                            comment={comment}
                            onReply={() => setReplyTo(comment.id)}
                            onResolve={(resolved) => toggleResolve(comment.id, resolved)}
                            onDelete={queueCommentDelete}
                            userId={userId}
                            role={role}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 space-y-2 border-t border-hub-foreground/8 pt-3">
                    {replyTo && (
                      <p className="text-xs text-hub-foreground/50">
                        Replying to thread ·{" "}
                        <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                          cancel
                        </button>
                      </p>
                    )}
                    <MentionComposer
                      value={body}
                      onChange={setBody}
                      members={members}
                      currentUserId={userId}
                      disabled={isPending}
                      placeholder="Add a comment… Type @ to mention"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault();
                          submitComment();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={isPending || !body.trim()}
                      onClick={submitComment}
                      className={cn(buttonVariants({ size: "sm" }), "min-h-10 w-full rounded-md bg-hub-espresso text-hub-paper sm:w-auto")}
                    >
                      Post comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <UndoToast
        message="Comment deleted"
        visible={deleteToastVisible}
        onUndo={undoCommentDelete}
      />
    </div>
  );
}

function CommentBlock({
  comment,
  onReply,
  onResolve,
  onDelete,
  userId,
  role,
}: {
  comment: CommentWithAuthor;
  onReply: () => void;
  onResolve: (resolved: boolean) => void;
  onDelete: (comment: CommentWithAuthor) => void;
  userId: string;
  role: HubRole;
}) {
  const isOwner = comment.author_id === userId;

  if (comment.resolved) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-md border border-hub-foreground/10 bg-hub-foreground/5 px-3 py-2 text-xs text-hub-foreground/50">
        <p>
          Resolved thread ·{" "}
          <button type="button" className="underline" onClick={() => onResolve(false)}>
            reopen
          </button>
        </p>
        {isOwner && (
          <CommentOptionsMenu onDelete={() => onDelete(comment)} />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-hub-foreground/10 bg-hub-surface px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-hub-foreground">{comment.author.display_name}</p>
        {isOwner && (
          <CommentOptionsMenu onDelete={() => onDelete(comment)} />
        )}
      </div>
      <p className="mt-1 text-sm text-hub-foreground/80">{comment.body}</p>
      <div className="mt-2 flex gap-3 text-xs text-hub-foreground/45">
        <button type="button" className="underline" onClick={onReply}>
          Reply
        </button>
        {(isOwner || canAdmin(role)) && (
          <button type="button" className="underline" onClick={() => onResolve(true)}>
            Resolve
          </button>
        )}
      </div>
      {comment.replies.length > 0 && (
        <div className="mt-2 space-y-2 border-l-2 border-hub-foreground/10 pl-3">
          {comment.replies.map((reply) => (
            <CommentReply
              key={reply.id}
              reply={reply}
              userId={userId}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentReply({
  reply,
  userId,
  onDelete,
}: {
  reply: CommentWithAuthor;
  userId: string;
  onDelete: (comment: CommentWithAuthor) => void;
}) {
  const isOwner = reply.author_id === userId;

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-hub-foreground">{reply.author.display_name}</p>
        {isOwner && (
          <CommentOptionsMenu onDelete={() => onDelete(reply)} />
        )}
      </div>
      <p className="text-sm text-hub-foreground/75">{reply.body}</p>
    </div>
  );
}
