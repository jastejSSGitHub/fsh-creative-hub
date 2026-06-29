"use client";

import { useEffect, useState, useTransition } from "react";
import { Link2 } from "lucide-react";

import { HubDialog } from "@/components/projects/hub-dialog";
import { TaskPresenceBanner } from "@/components/presence/task-presence-banner";
import { AssetPreviewPane } from "@/components/tasks/detail/asset-preview-pane";
import { MentionComposer } from "@/components/workspace/mention-composer";
import { TaskCompleteCheckbox } from "@/components/tasks/shared/task-complete-checkbox";
import { TaskDueBadge } from "@/components/tasks/shared/task-due-badge";
import { TaskDueDateField } from "@/components/tasks/shared/task-due-date-field";
import { TaskLabelChip } from "@/components/tasks/shared/task-label-chip";
import { TaskPriorityBadge } from "@/components/tasks/shared/task-priority-badge";
import { TaskPrioritySelect } from "@/components/tasks/shared/task-priority-select";
import { TaskVisibilityBadge } from "@/components/tasks/shared/task-visibility-badge";
import { HubSelect } from "@/components/ui/hub-select";
import { HubConfirmDialog } from "@/components/ui/hub-confirm-dialog";
import { parseMentionIds } from "@/lib/mentions/utils";
import { canEdit } from "@/lib/permissions";
import {
  addTaskCommentAction,
  completeTaskAction,
  deleteTaskAction,
  promoteTaskToProjectAction,
  uncompleteTaskAction,
  updateTaskAction,
} from "@/lib/tasks/actions";
import { getTaskComments } from "@/lib/tasks/queries";
import { getAssetsForTask, type LinkedAssetSummary } from "@/lib/tasks/task-assets";
import { getMockTaskComments, isMockDemoId } from "@/lib/dev-tools/mock-collaboration-data";
import { readMockCollaborationData } from "@/lib/dev-tools/storage";
import { deriveTaskVisibility } from "@/lib/tasks/visibility";
import { requestCollaborationOnboarding } from "@/lib/collaboration-onboarding/events";
import {
  useProjectPresence,
  useTaskViewers,
} from "@/lib/presence/use-hub-presence";
import type { TaskCommentWithAuthor, TaskPriority, TaskWithMeta } from "@/lib/tasks/types";
import {
  hubDialogCancelButtonClassName,
  hubDialogFieldClassName,
  hubDialogLabelClassName,
  hubDialogPrimaryButtonClassName,
} from "@/lib/ui/hub-dialog-form";
import { resolveCommentAction } from "@/lib/workspace/actions";
import type { HubLabel, HubProfile, HubRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type TaskDetailOverlayProps = {
  task: TaskWithMeta;
  role: HubRole | null;
  userId: string;
  userDisplayName?: string;
  userAvatarUrl?: string | null;
  members: HubProfile[];
  labels: HubLabel[];
  sections: { id: string; name: string }[];
  projects?: { id: string; name: string }[];
  onClose: () => void;
  onUpdated: () => void;
};

function TaskAssetsEmptyState() {
  return (
    <div className="flex items-start gap-2 rounded-[6px] border border-dashed border-hub-foreground/12 bg-hub-foreground/[0.02] px-3 py-2.5">
      <Link2 className="mt-0.5 size-3.5 shrink-0 text-hub-foreground/35" />
      <p className="text-xs leading-relaxed text-hub-foreground/50">
        No files linked yet. Create a task from asset feedback or use{" "}
        <span className="font-medium text-hub-foreground/65">Create task from comment</span>{" "}
        on a file.
      </p>
    </div>
  );
}

export function TaskDetailOverlay({
  task: initialTask,
  role,
  userId,
  userDisplayName = "You",
  userAvatarUrl = null,
  members,
  labels,
  sections,
  projects = [],
  onClose,
  onUpdated,
}: TaskDetailOverlayProps) {
  const editable = role ? canEdit(role) : initialTask.created_by === userId;
  const [task, setTask] = useState(initialTask);
  const [comments, setComments] = useState<TaskCommentWithAuthor[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<LinkedAssetSummary[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [assignNotice, setAssignNotice] = useState<string | null>(null);
  const [promoteProjectId, setPromoteProjectId] = useState("");
  const [resolvePrompt, setResolvePrompt] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const projectPresence = useProjectPresence({
    projectId: task.project_id,
    userId,
    displayName: userDisplayName,
    avatarUrl: userAvatarUrl,
    taskId: task.id,
    enabled: Boolean(task.project_id),
  });
  const taskViewers = useTaskViewers(task.project_id, task.id, projectPresence);

  const visibility = deriveTaskVisibility(
    task.project_id,
    task.project
      ? { is_org_wide: Boolean((task.project as { is_org_wide?: boolean }).is_org_wide) }
      : null,
  );
  const isPersonal = !task.project_id;

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  useEffect(() => {
    async function load() {
      if (readMockCollaborationData() && isMockDemoId(initialTask.id)) {
        setComments(getMockTaskComments(initialTask.id));
        setLinkedAssets([
          {
            id: "00000000-0000-4000-a000-000000000003",
            name: "Menu Poster v3",
            public_url: null,
            initiative_id: "00000000-0000-4000-a000-000000000002",
            project_id: "00000000-0000-4000-a000-000000000001",
            type: "image",
          },
        ]);
        setAssetsLoaded(true);
        return;
      }

      const supabase = createClient();
      const [commentData, assets] = await Promise.all([
        getTaskComments(supabase, initialTask.id),
        getAssetsForTask(supabase, initialTask.id),
      ]);
      setComments(commentData);
      setLinkedAssets(assets);
      setAssetsLoaded(true);
    }
    void load();
  }, [initialTask.id]);

  useEffect(() => {
    if (linkedAssets.length > 0) {
      setSelectedAssetId((current) => current ?? linkedAssets[0]?.id ?? null);
      requestCollaborationOnboarding("split-pane-task-asset");
      requestCollaborationOnboarding("task-asset-link");
    }
  }, [linkedAssets]);

  useEffect(() => {
    if (task.project_id) {
      requestCollaborationOnboarding("presence");
    }
    if (isPersonal && editable && projects.length > 0) {
      requestCollaborationOnboarding("promote-task");
    }
  }, [editable, isPersonal, projects.length, task.project_id]);

  useEffect(() => {
    if (searchParamsHasTask()) {
      requestCollaborationOnboarding("task-deep-link");
    }
    requestCollaborationOnboarding("task-visibility");
  }, []);

  function searchParamsHasTask(): boolean {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("task");
  }

  function savePatch(patch: Parameters<typeof updateTaskAction>[1]) {
    startTransition(async () => {
      const result = await updateTaskAction(task.id, patch);
      if (result.ok) onUpdated();
    });
  }

  function handleCommentSubmit(event: React.FormEvent) {
    event.preventDefault();
    const mentions = parseMentionIds(commentBody, members);
    startTransition(async () => {
      const result = await addTaskCommentAction({
        taskId: task.id,
        body: commentBody,
        mentions,
      });
      if (result.ok) {
        setCommentBody("");
        const supabase = createClient();
        setComments(await getTaskComments(supabase, task.id));
      }
    });
  }

  return (
    <HubDialog
      open
      onClose={onClose}
      title="Task details"
      className={cn(
        "w-[min(100vw-2rem,32rem)]",
        linkedAssets.length > 0 && "lg:w-[min(100vw-2rem,56rem)]",
      )}
      headerAction={
        <div className="flex items-center gap-2">
          <TaskVisibilityBadge visibility={visibility} />
          {task.due_at ? (
            <TaskDueBadge dueAt={task.due_at} variant="header" />
          ) : null}
        </div>
      }
    >
      <div className={cn(linkedAssets.length > 0 && "lg:grid lg:grid-cols-2 lg:gap-6")}>
        <div className="space-y-4">
        <TaskPresenceBanner viewers={taskViewers} />
        <div className="flex items-center gap-3">
          <TaskCompleteCheckbox
            completed={task.completed}
            onToggle={() => {
              startTransition(async () => {
                if (task.completed) {
                  await uncompleteTaskAction(task.id);
                  setTask({ ...task, completed: false, completed_at: null });
                } else {
                  const result = await completeTaskAction(task.id);
                  setTask({
                    ...task,
                    completed: true,
                    completed_at: new Date().toISOString(),
                  });
                  if (result.ok && result.suggestResolveCommentId) {
                    setResolvePrompt(result.suggestResolveCommentId);
                    requestCollaborationOnboarding("thread-resolve-loop");
                  }
                }
                onUpdated();
              });
            }}
            disabled={!editable || isPending}
          />
          <input
            value={task.name}
            onChange={(event) => setTask({ ...task, name: event.target.value })}
            onBlur={() => {
              if (task.name !== initialTask.name) savePatch({ name: task.name });
            }}
            disabled={!editable}
            className={cn(
              hubDialogFieldClassName,
              "min-h-[1.375rem] flex-1 border-0 bg-transparent px-0 py-0 text-[0.9375rem] font-semibold leading-[1.375rem] shadow-none focus:ring-0",
              task.completed && "text-hub-foreground/45 line-through",
            )}
          />
        </div>

        {resolvePrompt && (
          <div className="rounded-[6px] border border-hub-final/30 bg-hub-final/10 px-3 py-2 text-sm">
            <p className="text-hub-foreground/80">Resolve the original feedback thread?</p>
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-hub-primary hover:underline"
              onClick={() => {
                startTransition(async () => {
                  await resolveCommentAction(resolvePrompt, true);
                  setResolvePrompt(null);
                  onUpdated();
                });
              }}
            >
              Resolve thread
            </button>
          </div>
        )}

        {assignNotice && (
          <p className="rounded-[6px] bg-hub-primary/10 px-3 py-2 text-xs text-hub-primary">
            {assignNotice}
          </p>
        )}

        {(task.priority !== 4 || task.labels.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            <TaskPriorityBadge priority={task.priority as TaskPriority} />
            {task.labels.map((label) => (
              <TaskLabelChip key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
        )}

        {isPersonal && editable && projects.length > 0 && (
          <div className="flex flex-wrap items-end gap-2 rounded-[6px] border border-hub-foreground/10 p-3">
            <div className="min-w-0 flex-1 space-y-1">
              <label className={hubDialogLabelClassName}>Move to project</label>
              <HubSelect
                value={promoteProjectId}
                onChange={setPromoteProjectId}
                options={[
                  { value: "", label: "Select project…" },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
                variant="field"
              />
            </div>
            <button
              type="button"
              disabled={!promoteProjectId || isPending}
              className={hubDialogPrimaryButtonClassName}
              onClick={() => setPromoteConfirmOpen(true)}
            >
              Move
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <label className={hubDialogLabelClassName}>Description</label>
          <textarea
            value={task.description ?? ""}
            onChange={(event) =>
              setTask({ ...task, description: event.target.value })
            }
            onBlur={() => {
              if (task.description !== initialTask.description) {
                savePatch({ description: task.description });
              }
            }}
            disabled={!editable}
            rows={3}
            placeholder="Add notes, links, or context…"
            className={cn(hubDialogFieldClassName, "resize-none py-2")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={hubDialogLabelClassName}>Due date</label>
            <TaskDueDateField
              value={task.due_at}
              onChange={(dueAt) => {
                setTask({ ...task, due_at: dueAt });
                savePatch({ dueAt });
              }}
              disabled={!editable}
            />
          </div>

          <div className="space-y-1.5">
            <label className={hubDialogLabelClassName}>Priority</label>
            <TaskPrioritySelect
              value={task.priority as TaskPriority}
              onChange={(priority) => {
                setTask({ ...task, priority });
                savePatch({ priority });
              }}
              disabled={!editable}
            />
          </div>

          {sections.length > 0 && (
            <div className="space-y-1.5">
              <label className={hubDialogLabelClassName}>Section</label>
              <HubSelect
                value={task.section_id ?? ""}
                onChange={(value) => {
                  setTask({ ...task, section_id: value || null });
                  savePatch({ sectionId: value || null });
                }}
                disabled={!editable}
                options={[
                  { value: "", label: "No section" },
                  ...sections.map((s) => ({ value: s.id, label: s.name })),
                ]}
                variant="field"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className={hubDialogLabelClassName}>Assignee</label>
            <HubSelect
              value={task.assignee_id ?? ""}
              onChange={(value) => {
                const member = members.find((m) => m.id === value);
                if (isPersonal && value && value !== userId && member) {
                  setAssignNotice(`${member.display_name} will be able to see this task.`);
                } else {
                  setAssignNotice(null);
                }
                setTask({ ...task, assignee_id: value || null });
                savePatch({ assigneeId: value || null });
              }}
              disabled={!editable}
              options={[
                { value: "", label: "Unassigned" },
                ...members.map((m) => ({ value: m.id, label: m.display_name })),
              ]}
              variant="field"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={hubDialogLabelClassName}>Labels</label>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => {
              const active = task.labels.some((l) => l.id === label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  disabled={!editable}
                  onClick={() => {
                    const next = active
                      ? task.labels.filter((l) => l.id !== label.id)
                      : [...task.labels, label];
                    setTask({ ...task, labels: next });
                    savePatch({ labelIds: next.map((l) => l.id) });
                  }}
                  className={cn(
                    "rounded-[4px] border px-2 py-0.5 text-[0.6875rem] font-medium transition-colors",
                    active
                      ? "border-transparent"
                      : "border-hub-foreground/12 bg-hub-surface text-hub-foreground/55",
                  )}
                  style={
                    active
                      ? { backgroundColor: `${label.color}22`, color: label.color }
                      : undefined
                  }
                >
                  @{label.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-hub-foreground/10 pt-4">
          <h3 className="text-[0.6875rem] font-medium text-hub-foreground/45">
            Comments
          </h3>
          <div className="mt-2 space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-[6px] bg-hub-foreground/[0.03] px-3 py-2">
                <p className="text-[0.6875rem] font-medium text-hub-foreground/55">
                  {comment.author.display_name}
                </p>
                <p className="mt-0.5 text-[0.8125rem] text-hub-foreground">{comment.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="mt-3 space-y-2">
            <MentionComposer
              value={commentBody}
              onChange={setCommentBody}
              members={members}
              currentUserId={userId}
              rows={2}
              placeholder="Add a comment… type @ to mention"
            />
            <button
              type="submit"
              disabled={!commentBody.trim() || isPending}
              className={hubDialogPrimaryButtonClassName}
            >
              Comment
            </button>
          </form>
        </div>

        {editable && (
          <div className="flex justify-end border-t border-hub-foreground/10 pt-3">
            <button
              type="button"
              className={hubDialogCancelButtonClassName}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete task
            </button>
          </div>
        )}
        </div>

        {linkedAssets.length > 0 && selectedAssetId ? (
          <div className="mt-4 border-t border-hub-foreground/10 pt-4 lg:mt-0 lg:sticky lg:top-0 lg:border-t-0 lg:pt-0">
            <AssetPreviewPane
              assets={linkedAssets}
              selectedId={selectedAssetId}
              onSelect={setSelectedAssetId}
            />
          </div>
        ) : assetsLoaded ? (
          <div className="mt-4 border-t border-hub-foreground/10 pt-4 lg:mt-0 lg:border-t-0 lg:pt-0">
            <h3 className="text-[0.6875rem] font-medium text-hub-foreground/45">
              Linked assets
            </h3>
            <div className="mt-2">
              <TaskAssetsEmptyState />
            </div>
          </div>
        ) : null}
      </div>

      <HubConfirmDialog
        open={deleteConfirmOpen}
        title="Delete task"
        description="This permanently removes the task and its comments. Linked files stay on the project."
        confirmLabel="Delete task"
        tone="danger"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          startTransition(async () => {
            await deleteTaskAction(task.id);
            onUpdated();
            onClose();
          });
        }}
      />

      <HubConfirmDialog
        open={promoteConfirmOpen}
        title="Share with project team"
        description="Everyone on the selected project will be able to see and edit this task."
        confirmLabel="Move to project"
        onClose={() => setPromoteConfirmOpen(false)}
        onConfirm={() => {
          setPromoteConfirmOpen(false);
          startTransition(async () => {
            const result = await promoteTaskToProjectAction(task.id, promoteProjectId);
            if (result.ok) {
              onUpdated();
              onClose();
            }
          });
        }}
      />
    </HubDialog>
  );
}
