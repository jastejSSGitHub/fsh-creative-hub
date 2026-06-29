"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ListPlus, MessageSquareReply } from "lucide-react";

import { ForYouEmptyState } from "@/components/inbox/for-you-empty-state";
import { ForYouTargetContext } from "@/components/inbox/for-you-target-context";
import { MemberAvatar } from "@/components/projects/member-avatar";
import { MentionComposer } from "@/components/workspace/mention-composer";
import { buttonVariants } from "@/components/ui/button";
import { HubTooltip } from "@/components/ui/hub-tooltip";
import { RelativeTime } from "@/components/ui/relative-time";
import {
  SNOOZE_OPTIONS,
  isForYouItemHandled,
  isForYouItemSnoozed,
  markForYouItemHandled,
  snoozeForYouItem,
} from "@/lib/inbox/triage-storage";
import { parseMentionIds } from "@/lib/mentions/utils";
import type { ForYouItem } from "@/lib/inbox/queries";
import { createClient } from "@/lib/supabase/client";
import { requestCollaborationOnboarding } from "@/lib/collaboration-onboarding/events";
import { addTaskCommentAction, createFollowUpTaskAction } from "@/lib/tasks/actions";
import {
  deriveCaptureFromForYouItem,
  requestOpenQuickAdd,
} from "@/lib/tasks/capture-context";
import { addCommentAction } from "@/lib/workspace/actions";
import { getMockMembers, MOCK_PREFIX } from "@/lib/dev-tools/mock-collaboration-data";
import { readMockCollaborationData } from "@/lib/dev-tools/storage";
import {
  captureForYouOrigin,
  readForYouScrollY,
} from "@/lib/hub/origin-navigation";
import { assetPath, taskDeepLinkPath, type ForYouLens } from "@/lib/routes";
import type { HubProfile } from "@/types/database";
import { cn } from "@/lib/utils";

type ForYouListProps = {
  items: ForYouItem[];
  lens: ForYouLens;
};

const BADGE_STYLES: Record<ForYouItem["kind"], string> = {
  mention: "border-hub-primary/25 bg-hub-primary/10 text-hub-primary",
  upload_thread: "border-hub-foreground/20 bg-hub-foreground/6 text-hub-foreground/75",
  upload_stale: "border-hub-final/35 bg-hub-final/18 text-hub-foreground/80",
  task_mention: "border-hub-primary/25 bg-hub-primary/10 text-hub-primary",
  task_assigned: "border-emerald-400/35 bg-emerald-500/12 text-emerald-800",
  task_overdue: "border-rose-400/35 bg-rose-500/12 text-rose-700",
  vote_requested: "border-violet-400/35 bg-violet-500/12 text-violet-700",
  task_waiting: "border-amber-400/35 bg-amber-500/14 text-amber-800",
  following: "border-sky-400/35 bg-sky-500/12 text-sky-700",
  resolve_suggested: "border-hub-approved/35 bg-hub-approved/15 text-hub-approved",
};

const KIND_LABELS: Record<ForYouItem["kind"], string> = {
  mention: "Mention",
  upload_thread: "Upload thread",
  upload_stale: "Upload stale",
  task_mention: "Task mention",
  task_assigned: "Task assigned",
  task_overdue: "Task overdue",
  vote_requested: "Vote requested",
  task_waiting: "Waiting on others",
  following: "Following",
  resolve_suggested: "Resolve suggested",
};

const FOR_YOU_ACTION_BUTTON_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-hub-foreground/[0.05] px-2.5 text-xs font-medium text-hub-foreground/80 transition-colors hover:bg-hub-foreground/[0.09] hover:text-hub-foreground";

function forYouActionButtonClass(active = false) {
  return cn(
    FOR_YOU_ACTION_BUTTON_CLASS,
    active && "bg-hub-foreground/[0.09] text-hub-foreground",
  );
}

function isAssetLinkedItem(item: ForYouItem) {
  return (
    item.kind === "mention" ||
    item.kind === "upload_thread" ||
    item.kind === "upload_stale" ||
    item.kind === "vote_requested" ||
    item.kind === "resolve_suggested" ||
    (item.kind === "following" && "asset" in item)
  );
}

function itemHref(item: ForYouItem): string {
  if (
    "task" in item &&
    (item.kind === "task_mention" ||
      item.kind === "task_assigned" ||
      item.kind === "task_overdue" ||
      item.kind === "task_waiting" ||
      item.kind === "following")
  ) {
    return taskDeepLinkPath(item.task.id, item.task.project_id ?? null);
  }

  if ("asset" in item && "initiative" in item) {
    return assetPath(item.project.id, item.initiative.id, item.asset.id);
  }

  return "/for-you";
}

function itemActor(item: ForYouItem): { id: string; name: string; avatarUrl: string | null } {
  if ("comment" in item && "author" in item.comment) {
    return {
      id: item.comment.author.id,
      name: item.comment.author.display_name,
      avatarUrl: item.comment.author.avatar_url,
    };
  }

  if ("assigner" in item && item.assigner) {
    return {
      id: item.assigner.id,
      name: item.assigner.display_name,
      avatarUrl: item.assigner.avatar_url,
    };
  }

  return { id: "system", name: "Creative Hub", avatarUrl: null };
}

function itemDescription(item: ForYouItem): string {
  switch (item.kind) {
    case "mention":
      return "You were tagged in feedback.";
    case "upload_thread":
      return "New thread on your upload.";
    case "upload_stale":
      return "Your upload still needs input.";
    case "task_mention":
      return "You were mentioned on a task.";
    case "task_assigned":
      return "A task was assigned to you.";
    case "task_overdue":
      return "Assigned task is overdue.";
    case "vote_requested":
      return "Your vote is requested.";
    case "task_waiting":
      return "Waiting on someone else to complete this task.";
    case "following":
      return "Activity on something you are following.";
    case "resolve_suggested":
      return "Linked task is complete, review resolving this thread.";
    default:
      return "";
  }
}

export function ForYouList({ items, lens }: ForYouListProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<HubProfile[]>([]);
  const [replyOpenById, setReplyOpenById] = useState<Record<string, boolean>>({});
  const [draftById, setDraftById] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({});
  const [triageRefresh, setTriageRefresh] = useState(0);
  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);
  const [followUpById, setFollowUpById] = useState<Record<string, boolean>>({});
  const snoozeMenuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
    });
    if (readMockCollaborationData()) {
      setMembers(getMockMembers() as HubProfile[]);
    } else {
      void supabase
        .from("hub_profiles")
        .select("id, display_name, avatar_url, email, is_hub_admin, created_at")
        .order("display_name")
        .then(({ data }) => {
          if (mounted && data) setMembers(data as HubProfile[]);
        });
    }
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!snoozeMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      if (snoozeMenuRef.current?.contains(event.target as Node)) return;
      setSnoozeMenuId(null);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [snoozeMenuId]);

  const visibleItems = useMemo(() => {
    if (!userId) return items;
    return items.filter((item) => {
      if (isForYouItemHandled(userId, item.id)) return false;
      if (isForYouItemSnoozed(userId, item.id)) return false;
      return true;
    });
  }, [items, userId, triageRefresh]);

  const navigateFromForYou = useCallback(
    (href: string, itemId: string) => {
      captureForYouOrigin({
        lens,
        scrollY: readForYouScrollY(),
        itemId,
      });
      router.push(href);
    },
    [lens, router],
  );

  function markHandled(itemId: string) {
    if (!userId) return;
    markForYouItemHandled(userId, itemId);
    setTriageRefresh((value) => value + 1);
  }

  function snoozeItem(itemId: string, optionIndex: number) {
    if (!userId) return;
    const option = SNOOZE_OPTIONS[optionIndex];
    if (!option) return;
    const wakeAt = new Date(Date.now() + option.hours * 60 * 60 * 1000);
    snoozeForYouItem(userId, itemId, wakeAt);
    setSnoozeMenuId(null);
    setTriageRefresh((value) => value + 1);
    requestCollaborationOnboarding("for-you-triage");
  }

  function openFollowUpQuickAdd(item: ForYouItem) {
    requestOpenQuickAdd(deriveCaptureFromForYouItem(item));
    requestCollaborationOnboarding("smart-capture");
  }

  async function maybeCreateFollowUpTask(item: ForYouItem, body: string) {
    if (!followUpById[item.id]) return;

    const capture = deriveCaptureFromForYouItem(item);
    await createFollowUpTaskAction({
      name: body.slice(0, 120) || "Follow-up",
      projectId: capture.projectId ?? null,
      assetId: capture.assetId ?? null,
      description: body,
    });
  }

  function submitInlineReply(item: ForYouItem) {
    const body = (draftById[item.id] ?? "").trim();
    if (!body) return;

    setPendingById((prev) => ({ ...prev, [item.id]: true }));
    setErrorById((prev) => ({ ...prev, [item.id]: "" }));

    startTransition(async () => {
      if (item.id.startsWith(MOCK_PREFIX)) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setDraftById((prev) => ({ ...prev, [item.id]: "" }));
        setReplyOpenById((prev) => ({ ...prev, [item.id]: false }));
        setPendingById((prev) => ({ ...prev, [item.id]: false }));
        return;
      }

      if (
        "task" in item &&
        (item.kind === "task_mention" ||
          item.kind === "task_assigned" ||
          item.kind === "task_overdue" ||
          item.kind === "task_waiting" ||
          item.kind === "following")
      ) {
        const result = await addTaskCommentAction({
          taskId: item.task.id,
          body,
          mentions: parseMentionIds(body, members),
        });
        if (!result.ok) {
          setErrorById((prev) => ({
            ...prev,
            [item.id]: result.error ?? "Could not post comment.",
          }));
          setPendingById((prev) => ({ ...prev, [item.id]: false }));
          return;
        }
      } else if (isAssetLinkedItem(item) && "asset" in item) {
        const result = await addCommentAction({
          assetId: item.asset.id,
          body,
          parentId: "comment" in item ? item.comment.id : null,
          mentions: parseMentionIds(body, members),
        });
        if (!result.ok) {
          setErrorById((prev) => ({
            ...prev,
            [item.id]: result.error ?? "Could not post comment.",
          }));
          setPendingById((prev) => ({ ...prev, [item.id]: false }));
          return;
        }
      }

      await maybeCreateFollowUpTask(item, body);
      requestCollaborationOnboarding("for-you-inline-reply");
      requestCollaborationOnboarding("task-watch");

      setDraftById((prev) => ({ ...prev, [item.id]: "" }));
      setReplyOpenById((prev) => ({ ...prev, [item.id]: false }));
      setFollowUpById((prev) => ({ ...prev, [item.id]: false }));
      setPendingById((prev) => ({ ...prev, [item.id]: false }));
    });
  }

  if (visibleItems.length === 0) {
    return <ForYouEmptyState lens={lens} />;
  }

  return (
    <ul className="divide-y divide-hub-foreground/6">
      {visibleItems.map((item) => {
        const actor = itemActor(item);
        const open = Boolean(replyOpenById[item.id]);
        const actionsPinned = open || snoozeMenuId === item.id;
        const pending = Boolean(pendingById[item.id]) || isPending;
        const draft = draftById[item.id] ?? "";

        return (
          <li
            key={item.id}
            data-for-you-item-id={item.id}
            className="group/item px-4 py-4 sm:px-6"
          >
            <div className="flex gap-3 sm:gap-4">
              <MemberAvatar
                displayName={actor.name}
                avatarUrl={actor.avatarUrl}
                colorSeed={actor.id}
                variant="muted"
                size="md"
              />

              <div className="relative min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-0 sm:pr-2">
                  <span className="text-sm font-semibold text-hub-foreground">{actor.name}</span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.08em]",
                      BADGE_STYLES[item.kind],
                    )}
                  >
                    {KIND_LABELS[item.kind]}
                  </span>
                  <RelativeTime
                    iso={item.sort_at}
                    className="font-mono text-[0.58rem] text-hub-foreground/35"
                  />
                </div>

                <p className="mt-0.5 text-xs text-hub-foreground/45">{itemDescription(item)}</p>

                <ForYouTargetContext
                  item={item}
                  onNavigate={(href) => navigateFromForYou(href, item.id)}
                  onOpenInContext={() => navigateFromForYou(itemHref(item), item.id)}
                  onDismiss={() => markHandled(item.id)}
                />

                <div
                  className={cn(
                    "z-10 max-sm:relative max-sm:mt-2 sm:absolute sm:right-0 sm:top-0",
                    actionsPinned
                      ? "pointer-events-auto opacity-100"
                      : [
                          "pointer-events-none opacity-0",
                          "max-sm:pointer-events-auto max-sm:opacity-100",
                          "sm:group-hover/item:pointer-events-auto sm:group-hover/item:opacity-100",
                          "sm:group-focus-within/item:pointer-events-auto sm:group-focus-within/item:opacity-100",
                        ],
                  )}
                >
                  <div className="inline-flex w-fit max-w-full flex-wrap items-center justify-end gap-1.5 transition-opacity duration-150">
                    <HubTooltip label="Reply in line" side="top">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !open;
                          setReplyOpenById((prev) => ({ ...prev, [item.id]: next }));
                          if (next) requestCollaborationOnboarding("for-you-inline-reply");
                        }}
                        className={forYouActionButtonClass(open)}
                      >
                        <MessageSquareReply className="size-3.5" aria-hidden />
                        {open ? "Cancel" : "Reply"}
                      </button>
                    </HubTooltip>
                    <div
                      className="relative"
                      ref={snoozeMenuId === item.id ? snoozeMenuRef : undefined}
                    >
                      <HubTooltip label="Snooze for later" side="top">
                        <button
                          type="button"
                          aria-expanded={snoozeMenuId === item.id}
                          onClick={() =>
                            setSnoozeMenuId((current) =>
                              current === item.id ? null : item.id,
                            )
                          }
                          className={forYouActionButtonClass(snoozeMenuId === item.id)}
                        >
                          Snooze
                          <ChevronDown className="size-3" />
                        </button>
                      </HubTooltip>
                      {snoozeMenuId === item.id && (
                        <div className="absolute right-0 top-full z-20 mt-1 min-w-[9rem] overflow-hidden rounded-md border border-hub-foreground/15 bg-hub-paper py-1 shadow-lg">
                          {SNOOZE_OPTIONS.map((option, index) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => snoozeItem(item.id, index)}
                              className="block w-full px-3 py-1.5 text-left text-xs font-medium text-hub-foreground/85 transition-colors hover:bg-hub-foreground/[0.05]"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <HubTooltip label="Quick add linked task" side="top">
                      <button
                        type="button"
                        onClick={() => openFollowUpQuickAdd(item)}
                        className={forYouActionButtonClass()}
                      >
                        <ListPlus className="size-3.5" aria-hidden />
                        Add task
                      </button>
                    </HubTooltip>
                    <HubTooltip label="Dismiss from For You" side="top">
                      <button
                        type="button"
                        onClick={() => markHandled(item.id)}
                        className={forYouActionButtonClass()}
                      >
                        <Check className="size-3.5" aria-hidden />
                        Mark handled
                      </button>
                    </HubTooltip>
                  </div>
                </div>

                {open && (
                  <div className="mt-3 space-y-2 rounded-md border border-hub-foreground/10 bg-hub-surface p-3">
                    <MentionComposer
                      value={draft}
                      onChange={(value) => setDraftById((prev) => ({ ...prev, [item.id]: value }))}
                      members={members}
                      currentUserId={userId ?? undefined}
                      rows={2}
                      disabled={pending}
                      placeholder="Reply… Type @ to mention"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault();
                          submitInlineReply(item);
                        }
                      }}
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-hub-foreground/65">
                      <input
                        type="checkbox"
                        checked={Boolean(followUpById[item.id])}
                        onChange={(event) =>
                          setFollowUpById((prev) => ({
                            ...prev,
                            [item.id]: event.target.checked,
                          }))
                        }
                        className="size-3.5 rounded border-hub-foreground/20"
                      />
                      Also create follow-up task
                    </label>
                    {errorById[item.id] && (
                      <p className="text-xs text-hub-rejected">{errorById[item.id]}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => submitInlineReply(item)}
                      disabled={pending || !draft.trim()}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "h-8 rounded-md bg-hub-espresso px-3 text-xs text-hub-paper",
                      )}
                    >
                      Send reply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
