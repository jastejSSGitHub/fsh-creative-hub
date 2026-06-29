# FSH Creative Hub — Collaboration Features Implementation Spec

**Version:** 1.0  
**Status:** Ready for agent-driven implementation  
**Owner:** FSH Design / Product  
**Related docs:** `FSH_Creative_Hub_PRD.md`, `Todoist_Feature_Reference.md`, `Hub_Overlay_UI_Style.md`

---

## How to use this document (for agents)

This spec is the **single source of truth** for building seamless collaboration across **For You** and **Tasks**. Work through features **in phase order** (A → B → C). Within each phase, complete items in the listed sequence unless dependencies say otherwise.

### Per-feature checklist (complete every item)

For each feature ID (e.g. `COLAB-A01`):

1. Read **Dependencies** — do not start until they are done.
2. Implement **Technical spec** (schema, queries, actions, UI).
3. Implement **Onboarding** (if specified) using the animation storyboard.
4. Update **Empty states** (if specified).
5. Run **Acceptance criteria** — all must pass.
6. Mark status: `[ ]` → `[x]` in the **Master progress tracker** at the bottom.

### Conventions to follow

| Area | Reference in codebase |
|------|------------------------|
| Tasks empty state + strike-through animation | `src/components/tasks/shared/tasks-empty-state.tsx` |
| For You empty state + SVG motion | `src/components/inbox/for-you-empty-state.tsx` |
| Hub feature tour modal | `src/components/onboarding/feature-onboarding-modal.tsx` |
| Project spotlight onboarding | `src/components/project-files/project-onboarding.tsx`, `project-share-onboarding-card.tsx` |
| Onboarding persistence | `src/lib/onboarding/storage.ts`, `src/lib/project-files/onboarding-storage.ts` |
| Quick add parser | `src/lib/tasks/quick-add/parse-quick-add.ts` |
| Task RLS / inbox privacy | `supabase/migrations/016_hub_tasks.sql` |
| For You queries | `src/lib/inbox/queries.ts` |
| Task detail overlay | `src/components/tasks/detail/task-detail-overlay.tsx` |
| Mention composer | `src/components/workspace/mention-composer.tsx` |

### Onboarding system (new — shared across features)

Create a reusable collaboration onboarding layer:

```
src/lib/collaboration-onboarding/
  storage.ts          # per-user, per-feature keys: fsh-colab-onboarding-{featureId}:{userId}
  types.ts            # CollaborationOnboardingFeatureId union
  steps.ts            # step copy + illustration variant ids

src/components/collaboration-onboarding/
  collaboration-onboarding-card.tsx    # 1–2 step spotlight card (like project-share-onboarding-card)
  collaboration-onboarding-host.tsx    # mounts cards when trigger conditions met
  illustrations/                       # one file per illustration variant (Framer Motion)
    needs-you-feed-preview.tsx
    global-quick-add-preview.tsx
    visibility-badge-preview.tsx
    task-asset-link-preview.tsx
    ...
```

**Animation principles** (match existing hub quality):

- Use **Framer Motion**; respect `useReducedMotion()`.
- Easing: `[0.22, 1, 0.36, 1]` for entrances; spring for micro-interactions.
- **Mini UI replicas** — not abstract icons. Show faux task rows, feed items, badges at ~60–70% scale inside a bordered card (same pattern as `TaskListPreviewHero` in `tasks-empty-state.tsx`).
- **Looping demo sequences** — 3–6s cycle: idle → action (cursor press, checkbox, strike-through, badge appear) → reset. Auto-play once on mount, then loop subtly.
- **Strike-through / completion** — reuse the `PreviewTaskRow` pattern: checkbox press ripple → check → `line-through` on label.
- **Persistence** — show onboarding max **2 times** per feature per user (mirror `FEATURE_ONBOARDING_MAX_VIEWS`), then never again unless dev-tools “Replay onboarding” is used.
- **Dismiss** — “Got it” + optional “Don’t show again”; store completion in localStorage.

### New route helpers (add when implementing)

```ts
// src/lib/routes.ts
export function taskDeepLinkPath(taskId: string, projectId?: string | null): string
export function forYouLensPath(lens: ForYouLens): string  // e.g. /for-you?lens=needs-you
```

---

## Vision

Unify **creative review** (assets, comments, votes) and **task management** into one collaboration loop:

```
Asset comment → Task → Completion → Resolve thread → Vote / Final pick
```

**For You** becomes the action center. **Tasks** stay easy to capture everywhere. **Privacy** is visible at the moment of sharing.

---

# Phase A — Highest ROI (unify surfaces)

---

## COLAB-A01 — Unified “Needs you” feed

**Status:** `[ ]`

### Summary

Expand For You from “mentions only” into a **priority-sorted action feed** that blends creative signals and task signals.

### User story

As a team member, I open For You and immediately see everything that needs my attention — mentions, assigned tasks, overdue work, and assets awaiting my vote — sorted by urgency, not just recency.

### Feed item types (extend `ForYouItem`)

| Kind | Source | Privacy |
|------|--------|---------|
| `mention` | `hub_comments` @mentions | Project members |
| `upload_thread` | Comments on my uploads | Project members |
| `task_mention` | `hub_task_comments` @mentions | Creator/assignee for inbox tasks; members for project tasks |
| `task_assigned` | `hub_tasks` where `assignee_id = me` and not completed | Inbox = private; project = members |
| `task_overdue` | `hub_tasks` assigned to me, `due_at < now`, not completed | Same as above |
| `vote_requested` | Assets in my projects where I haven’t voted and status is `pending` | Project members |

### Priority scoring (client or server)

Sort key (higher = top):

1. Overdue assigned task (+100)
2. Due today assigned task (+80)
3. Unresolved @mention (+70)
4. Task @mention (+65)
5. Upload thread on my asset (+50)
6. Vote requested (+40)
7. Assigned task with no due date (+30)

Tie-break: `created_at` / `due_at` descending.

### Technical spec

**Files to create/modify:**

- `src/lib/inbox/queries.ts` — extend types and `getForYouItems()`
- `src/lib/inbox/priority.ts` — `scoreForYouItem()`, `sortForYouItems()`
- `src/lib/inbox/views.ts` — add lens `needs-you` (default), keep `inbox` | `replies` | `assigned` as sub-filters or migrate
- `src/components/inbox/for-you-list.tsx` — render new item kinds with labels/icons
- `src/components/inbox/for-you-sidebar.tsx` — nav entry “Needs you” with count
- `src/app/(hub)/for-you/page.tsx` — pass expanded items

**New query functions:**

```ts
getAssignedTasksForUser(supabase, userId)
getOverdueTasksForUser(supabase, userId)
getPendingVotesForUser(supabase, userId)
```

**List row UI per kind:**

- `task_assigned` — avatar of assigner (or “System”), badge “Assigned”, task name, project/inbox context, due badge
- `task_overdue` — red due badge, badge “Overdue”
- `vote_requested` — asset thumbnail, badge “Your vote”, project name

**Deep links:** use `taskDeepLinkPath` (COLAB-A03) when available; until then `projectTasksPath`.

### Onboarding

**Feature ID:** `needs-you-feed`  
**Trigger:** First visit to `/for-you` after this ships, when `shouldShowCollaborationOnboarding('needs-you-feed', userId)`.  
**Steps:** 2

#### Step 1 — “One place for what needs you”

| Field | Value |
|-------|-------|
| Title | Everything that needs you, in one feed |
| Body | Mentions, assigned tasks, overdue work, and votes — sorted by what blocks progress first. |
| CTA | Show me |
| Placement | Centered card over dimmed feed (mobile: bottom sheet) |

**Animation storyboard — `NeedsYouFeedPreview`:**

1. **0.0s** — Mini feed card fades in (3 skeleton rows staggered left).
2. **0.8s** — Row 1: “@mention on Summer Poster” slides in with blue badge pulse.
3. **1.4s** — Row 2: “Fix headline” task row; red “Overdue” chip scales in (spring).
4. **2.0s** — Row 3: asset thumb + “Your vote” badge; subtle fire emoji bounce.
5. **2.8s** — Rows reorder (layout animation): overdue jumps to top.
6. **3.5s** — Loop reset (opacity crossfade).

#### Step 2 — “Privacy stays intact”

| Field | Value |
|-------|-------|
| Title | Personal tasks stay personal |
| Body | Inbox tasks only appear for you and whoever you assign. Project work is visible to the team. |
| CTA | Got it |

**Animation — `PrivacyFeedPreview`:**

1. Split card: left “Personal inbox” with lock icon; one task row visible to single avatar.
2. Right “Blenz project” with two avatars; shared task row.
3. Animated cursor tries to drag personal task to project side → **shake + lock flash** (cannot cross without promote — tease COLAB-A04).
4. Strike-through on a demo personal task when “only you” avatar checks it.

### Empty state update

Update `ForYouEmptyState` for default lens:

- Title: **You’re all caught up**
- Body: **When someone @mentions you, assigns you work, or needs your vote, it’ll show up here — sorted by urgency.**

**Animation:** extend `InboxIllustration` — add a third mini row that animates in (task checkbox + strike-through) after checkmark path draws.

### Acceptance criteria

- [ ] Feed shows all 6 item kinds when data exists
- [ ] Inbox tasks (`project_id = null`) never appear for non-creator/non-assignee
- [ ] Sort order matches priority table
- [ ] Count badge on sidebar matches filtered “needs you” items
- [ ] Onboarding shows once (max 2 views), respects reduced motion
- [ ] Empty state plays extended animation

### Dependencies

None (first item in Phase A).

---

## COLAB-A02 — Global Quick Add + keyboard shortcut

**Status:** `[ ]`

### Summary

Quick Add available from **any hub page** (For You, Projects, asset overlay, project home), not only Tasks workspace. **`Q`** opens it globally.

### User story

As a user anywhere in the hub, I press `Q` or tap Add, type natural language (`Review copy tomorrow @design #Blenz +sandeep`), and the task is created without navigating away.

### Technical spec

**Extract / elevate:**

- `src/components/tasks/quick-add/quick-add-panel.tsx` → ensure it works without `TasksWorkspaceClient` context
- New: `src/components/tasks/quick-add/global-quick-add-host.tsx` — mounted in `hub-shell.tsx`
- New: `src/hooks/use-global-quick-add.ts` — `open`, `close`, `toggle`; listens for `Q` key (ignore when typing in input/textarea/contenteditable)

**Defaults when opened from non-task routes:**

- `projectId: null` (personal inbox) unless URL is `/projects/[id]/*` → default to that project
- Parse via existing `parseQuickAdd()`

**Mobile:** reuse `DynamicAddButton` pattern; show on hub shell for authenticated routes except canvas full-bleed.

**Server:** existing `createTaskAction` — no change.

### Onboarding

**Feature ID:** `global-quick-add`  
**Trigger:** First time user presses `Q` OR taps global FAB (whichever comes first).  
**Steps:** 1 (single spotlight)

| Field | Value |
|-------|-------|
| Title | Add a task from anywhere |
| Body | Press **Q** or tap **+** — same quick add you know from Tasks. Use `#Project`, `+name`, `@label`, and dates inline. |
| CTA | Try it |

**Animation — `GlobalQuickAddPreview`:**

1. Faux hub top bar with blurred content behind.
2. **`Q` key cap** — scale pulse (1 → 1.1 → 1) every 2s.
3. Quick add bar slides down from top; typed text animates: `Brief review tomorrow #Blenz @design`
4. Chips pop in sequentially (date, project, label) — reuse `quickAddToChips` visual style.
5. **Enter** key press animation → task row drops into mini inbox list below; strike-through after checkbox auto-completes (callback to A01 empty state pattern).

**Spotlight:** highlight real global quick add input after dismiss.

### Acceptance criteria

- [ ] `Q` opens quick add on `/for-you`, `/projects`, `/projects/[id]`, `/tasks/*`
- [ ] `Q` does not fire when focus is in text fields
- [ ] Project context pre-fills `#project` when inside a project route
- [ ] Created task appears in correct inbox/project
- [ ] Onboarding spotlight targets live quick add element
- [ ] Canvas full-bleed route excluded or uses alternate entry

### Dependencies

None.

---

## COLAB-A03 — Task deep links + overlay from For You

**Status:** `[ ]`

### Summary

Links from For You (and notifications later) open the **task detail overlay** directly with `?task=` query param, instead of dumping users on the project tasks list.

### User story

As a user, I click a task mention in For You and land on the exact task with comments visible — not the generic tasks page.

### Technical spec

**Routes:**

```ts
// tasksDeepLink: /tasks/today?task={taskId}
// project tasks: /projects/{projectId}/tasks?task={taskId}
export function taskDeepLinkPath(taskId: string, projectId?: string | null): string
```

**Modify:**

- `tasks-workspace-client.tsx` — on mount, read `searchParams.task`, fetch task, `setSelectedTask`
- Project tasks page equivalent
- `for-you-list.tsx` — href uses `taskDeepLinkPath`

**Edge cases:**

- Task deleted → toast “Task no longer available”
- No access → redirect to For You with error

### Onboarding

**Feature ID:** `task-deep-link`  
**Trigger:** First click on any `task_mention` or `task_assigned` item in For You.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Jump straight to the task |
| Body | Mentions and assignments open the task panel directly — reply, reassign, or mark done without losing your place. |
| CTA | Got it |

**Animation — `TaskDeepLinkPreview`:**

1. Left: mini For You row “@you on Fix headline”.
2. **Animated link line** (SVG path draw) to right: task overlay sliding in over dimmed project view.
3. Comment thread stub highlights; cursor blinks in reply field.
4. Checkbox on task → strike-through (reuse `PreviewTaskRow`).

**Placement:** tooltip card anchored to clicked list item before navigation (optional 800ms delay then navigate).

### Acceptance criteria

- [ ] All task-type For You items link with `?task=`
- [ ] Overlay opens automatically on target page load
- [ ] Browser back closes overlay / clears param
- [ ] Works for inbox tasks (`TASKS_TODAY_PATH`) and project tasks

### Dependencies

COLAB-A01 (task items in feed) recommended but not blocking.

---

## COLAB-A04 — Task visibility badges + assign/share confirmation

**Status:** `[ ]`

### Summary

Every task shows a **visibility badge**: `Personal` | `Project` | `Team`. Assigning someone on a personal task shows a **confirmation line**: “{Name} will be able to see this task.”

### User story

As a user, I always know who can see my work before I assign or share it.

### Technical spec

**Visibility derivation (no schema change):**

```ts
type TaskVisibility = 'personal' | 'project' | 'team';

function deriveTaskVisibility(task, project?): TaskVisibility {
  if (!task.project_id) return 'personal';
  if (project?.is_org_wide) return 'team'; // from migration 015
  return 'project';
}
```

**UI:**

- `src/components/tasks/shared/task-visibility-badge.tsx` — lock / users / building icons
- Show on: `task-row.tsx`, `task-detail-overlay.tsx`, For You task items
- On assignee change in overlay (personal task): inline confirmation banner

**Colors:**

- Personal: `hub-foreground/50` + lock
- Project: `hub-primary/80` + users
- Team: `hub-final` + globe/building

### Onboarding

**Feature ID:** `task-visibility`  
**Trigger:** First time user opens a **personal inbox** task detail OR first assign on personal task.  
**Steps:** 2

#### Step 1 — Badges

| Field | Value |
|-------|-------|
| Title | Know who can see each task |
| Body | **Personal** — just you (and assignee). **Project** — your team. **Team** — org-wide. |
| CTA | Next |

**Animation — `VisibilityBadgePreview`:**

1. Three mini task rows stack vertically.
2. Badges fade in one-by-one with icon bounce: Personal (lock), Project (2 avatars), Team (3+ avatars).
3. Personal row: second avatar **fades in** when `+assign` chip animates — label “Shared with assignee”.

#### Step 2 — Assign confirmation

| Field | Value |
|-------|-------|
| Title | Assigning shares the task |
| Body | When you assign a personal task, that person gets access. You’ll see a confirmation before it happens. |
| CTA | Got it |

**Animation — `AssignConfirmPreview`:**

1. Assignee dropdown opens; name “Sandeep” selects.
2. Banner slides down: “Sandeep will see this task” with checkmark.
3. Task row badge morphs Personal → Personal · Shared (or similar).

### Acceptance criteria

- [ ] Badge visible on all task surfaces
- [ ] Correct visibility for inbox vs project vs org-wide project
- [ ] Assign on personal task shows confirmation before save (or inline after with undo 5s)
- [ ] Onboarding does not show for project-only users who never use inbox

### Dependencies

None.

---

## COLAB-A05 — Promote personal task to project

**Status:** `[ ]`

### Summary

**Promote** action moves a personal inbox task into a project (with confirm dialog). RLS already allows project members to see it after `project_id` is set.

### User story

As a user, I started a personal reminder and now want the team to see it — one action promotes it into the right project.

### Technical spec

**Action:**

```ts
promoteTaskToProjectAction(taskId, projectId, sectionId?)
```

- Validates: user is `created_by` or `assignee`, task is inbox (`project_id` null), user `hub_can_edit(projectId)`
- Updates `project_id`, optional `section_id`

**UI:**

- `task-detail-overlay.tsx` — “Move to project…” menu item (personal only)
- Dialog: project picker + optional section
- Success toast with link to project tasks

### Onboarding

**Feature ID:** `promote-task`  
**Trigger:** First time user opens “Move to project…” on a personal task.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Share with the team when you’re ready |
| Body | Move a personal task into a project so everyone on that project can see and collaborate. |
| CTA | Got it |

**Animation — `PromoteTaskPreview`:**

1. Task card with **Personal** badge in left “Inbox” column.
2. **Drag animation** (or arrow morph) to right “Blenz” project column.
3. Mid-flight: confirmation modal flash “Share with Blenz team?”
4. Lands in project column; badge morphs to **Project**; confetti dot burst (subtle, 3 particles).

### Acceptance criteria

- [ ] Only personal tasks show promote action
- [ ] Only projects user can edit appear in picker
- [ ] After promote, task visible to all project members
- [ ] Assignee retained

### Dependencies

COLAB-A04 (visibility badges).

---

# Phase B — Creative Hub differentiation

---

## COLAB-B01 — Task ↔ asset linking (schema + UI)

**Status:** `[ ]`

### Summary

Junction table links tasks to assets. Task detail shows linked assets; asset overlay shows open tasks.

### User story

As a designer, I see which assets a task refers to, and which tasks exist for an asset I’m reviewing.

### Technical spec

**Migration `018_hub_task_assets.sql`:**

```sql
create table public.hub_task_assets (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.hub_tasks (id) on delete cascade,
  asset_id uuid not null references public.hub_assets (id) on delete cascade,
  created_by uuid not null references public.hub_profiles (id),
  created_at timestamptz not null default now(),
  unique (task_id, asset_id)
);

-- RLS: access if hub_can_access_task(task_id) AND hub_is_member(project for asset)
```

**API:**

- `linkTaskAssetAction`, `unlinkTaskAssetAction`
- `getTasksForAsset(supabase, assetId)`
- `getAssetsForTask(supabase, taskId)`

**UI:**

- `task-detail-overlay.tsx` — “Linked assets” strip (thumbnails, click → asset overlay)
- `asset-detail-overlay.tsx` — “Tasks” section listing open tasks + “Link existing task”
- For You items for linked context show thumbnail when available

### Onboarding

**Feature ID:** `task-asset-link`  
**Trigger:** First visit to asset detail after ship OR first link action.  
**Steps:** 2

#### Step 1 — From asset

| Field | Value |
|-------|-------|
| Title | Tasks tied to your assets |
| Body | See open tasks on any asset. Create or link work without losing visual context. |
| CTA | Next |

**Animation — `AssetTasksPanelPreview`:**

1. Mini asset frame (poster rectangle).
2. “Tasks” drawer slides up from bottom with 2 task rows.
3. Third row dashed “+ Link task” — on tap, row materializes with strike-through demo.

#### Step 2 — From task

| Field | Value |
|-------|-------|
| Title | Assets on the task |
| Body | Linked thumbnails appear on the task — click to jump back to the asset. |
| CTA | Got it |

**Animation — `TaskAssetStripPreview`:**

1. Task overlay with horizontal thumb strip.
2. Thumbs scale in L→R; hover on first enlarges slightly.
3. Click ripple → asset preview expands (split pane hint).

### Acceptance criteria

- [ ] Link/unlink works with RLS
- [ ] Asset shows only tasks user can access
- [ ] Thumbnails use existing asset URL helpers
- [ ] Deep link from task thumb opens asset overlay

### Dependencies

COLAB-A03 (deep links helpful).

---

## COLAB-B02 — Create task from asset comment

**Status:** `[ ]`

### Summary

One-click **“Create task”** on any asset comment (or selection). Pre-fills task name from comment, links asset, suggests assignee from thread.

### User story

As a reviewer, I turn feedback into actionable work without copy-pasting.

### Technical spec

**UI:**

- `asset-detail-overlay.tsx` / comment row menu — “Create task from comment”
- Opens quick add pre-filled:
  - `name`: first 120 chars of comment (strip mentions)
  - `projectId`: from initiative
  - `description`: full comment + link back
  - `labelIds`: suggest `@design` if on creative asset
  - Auto `linkTaskAsset` on create

**Action:**

```ts
createTaskFromCommentAction({ commentId, assetId, overrides? })
```

### Onboarding

**Feature ID:** `comment-to-task`  
**Trigger:** First time user hovers a comment on an asset (spotlight on ⋮ menu).  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Turn feedback into tasks |
| Body | Any comment can become a task — linked to this asset, ready to assign. |
| CTA | Got it |

**Animation — `CommentToTaskPreview`:**

1. Comment bubble: “Headline too small on mobile”.
2. **Morph animation** — bubble compresses into task row in mini list.
3. Asset thumb glues to left of row (link icon pulse).
4. `+assignee` chip lands; checkbox → strike-through.

### Acceptance criteria

- [ ] Task created in correct project
- [ ] Asset link exists
- [ ] Comment author NOT auto-assigned unless user chooses
- [ ] Works on threaded replies

### Dependencies

COLAB-B01 (task-asset link).

---

## COLAB-B03 — Inline reply from For You

**Status:** `[ ]`

### Summary

Reply to asset comments and task comments **inline** in For You without full navigation. Optional “Create follow-up task” checkbox.

### User story

As a user, I clear my For You queue by replying in place.

### Technical spec

**UI:**

- `for-you-list.tsx` — expand row → `MentionComposer` inline
- Submit: existing comment actions (`addCommentAction`, `addTaskCommentAction`)
- On success: item marked handled (local state) or refresh
- Checkbox: “Create follow-up task” → calls COLAB-B02 flow with reply body

**State:**

- `expandedItemId` in list component
- Optimistic reply append

### Onboarding

**Feature ID:** `for-you-inline-reply`  
**Trigger:** First expand on any For You item.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Reply without leaving For You |
| Body | Expand any item to respond inline. Optionally spin up a follow-up task in the same step. |
| CTA | Got it |

**Animation — `InlineReplyPreview`:**

1. Feed row expands height (layout animation).
2. Composer fades in; typed `@` mention autocomplete stub.
3. Send button press → reply nests under row; checkmark on parent item.
4. Optional: task row peels off below with dashed connector.

### Acceptance criteria

- [ ] Reply posts to correct thread (asset vs task)
- [ ] Mentions parsed correctly
- [ ] Item count decreases or item moves to “handled”
- [ ] Follow-up task optional path works

### Dependencies

COLAB-A01, COLAB-B02 (optional task checkbox).

---

## COLAB-B04 — Collaboration lenses (For You views)

**Status:** `[ ]`

### Summary

Add **lenses** alongside existing views:

| Lens ID | Label | Filter |
|---------|-------|--------|
| `needs-you` | Needs you | Default unified feed (A01) |
| `waiting-on-others` | Waiting on others | Tasks I created assigned to others, incomplete; my uploads with no reply in 48h |
| `following` | Following | Tasks/assets I commented on, not assignee (watchers) |
| `your-uploads` | Your uploads | `upload_thread` only |

### Technical spec

- `src/lib/inbox/lenses.ts` — filter functions
- `for-you-sidebar.tsx` — lens nav with counts
- URL: `/for-you?lens=waiting-on-others`
- Persist last lens per user in localStorage

**Watchers query:**

- Tasks where user id in comment authors, `assignee_id != user`, not completed
- Assets where user commented, not uploader

### Onboarding

**Feature ID:** `for-you-lenses`  
**Trigger:** First visit after lenses ship (if A01 onboarding already seen, show this instead).  
**Steps:** 2

#### Step 1

| Field | Value |
|-------|-------|
| Title | Switch lenses, not tabs |
| Body | **Needs you** — your action queue. **Waiting on others** — what you’re blocked on. **Following** — threads you care about. |
| CTA | Next |

**Animation — `LensesTabPreview`:**

1. Horizontal lens pills; active pill slides (layoutId).
2. Content crossfades between mini lists (3 variants, 1.5s each).

#### Step 2

| Field | Value |
|-------|-------|
| Title | Your uploads, separate |
| Body | **Your uploads** collects feedback on files you own — easy to scan without the noise. |
| CTA | Got it |

**Animation — upload lens with avatar on uploader thumb + comment badges.

### Empty states per lens

Create `for-you-empty-state.tsx` variants or extend `EMPTY_COPY`:

| Lens | Title | Body |
|------|-------|------|
| `waiting-on-others` | Nothing out pending | Tasks you delegated and uploads awaiting feedback show here. |
| `following` | Not watching anything yet | Comment on a task or asset to follow along without owning it. |
| `your-uploads` | No feedback on your uploads | When someone comments on your files, it appears here. |

Each with unique SVG animation (reuse For You illustration patterns).

### Acceptance criteria

- [ ] All lenses filter correctly
- [ ] Counts in sidebar accurate
- [ ] URL reflects lens; shareable
- [ ] Empty states per lens with motion

### Dependencies

COLAB-A01.

---

## COLAB-B05 — Task watchers (Following lens backend)

**Status:** `[ ]`

### Summary

Explicit **watch** toggle on tasks (optional schema) OR implicit from comments (v1). Notify watchers in Following lens only (no push in v1).

### Technical spec

**V1 (implicit):** Following lens uses comment participation (B04).  
**V2 (optional migration):**

```sql
create table public.hub_task_watchers (
  task_id uuid references hub_tasks(id) on delete cascade,
  user_id uuid references hub_profiles(id) on delete cascade,
  primary key (task_id, user_id)
);
```

**UI:**

- Task overlay: “Watch” bell toggle (if V2)
- Auto-watch on comment

### Onboarding

**Feature ID:** `task-watch`  
**Trigger:** First time user comments on someone else’s task.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | You’re following this task |
| Body | Comments on tasks you’re involved in appear in **Following** on For You — no need to be assignee. |
| CTA | Got it |

**Animation — bell icon ring + mini feed item “Activity on Fix headline” sliding in.

### Acceptance criteria

- [ ] Following lens populated for commenters
- [ ] Bell toggle works if V2 implemented
- [ ] No email/push (per PRD non-goals)

### Dependencies

COLAB-B04.

---

# Phase C — Workflow loop & polish

---

## COLAB-C01 — Thread → task → resolve loop

**Status:** `[ ]`

### Summary

When a **linked task** is completed, prompt to **resolve** the source comment thread. “Convert to task” marks comment with `linked_task_id` metadata.

### Technical spec

**Migration** — add to `hub_comments`:

```sql
alter table hub_comments add column linked_task_id uuid references hub_tasks(id) on delete set null;
```

**Flow:**

1. B02 create-from-comment sets `linked_task_id`
2. On `completeTaskAction` — if linked comment unresolved, return `{ suggestResolveCommentId }`
3. UI toast: “Resolve feedback thread?” → sets `resolved = true`

**For You:** completed task + unresolved comment → item “Resolve thread?”

### Onboarding

**Feature ID:** `thread-resolve-loop`  
**Trigger:** First task completion that has `linked_task_id`.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Close the loop |
| Body | Finished the task? Resolve the original feedback so the team knows it’s handled. |
| CTA | Got it |

**Animation — `ResolveLoopPreview`:**

1. Comment bubble → task row (B02 morph, faster).
2. Checkbox complete → strike-through on task.
3. **Resolve checkmark** on original comment bubble (green pulse).
4. Consensus bar on mini asset ticks up (optional).

### Acceptance criteria

- [ ] Link stored on comment
- [ ] Resolve prompt on complete
- [ ] Resolve marks comment resolved
- [ ] For You shows resolve suggestions

### Dependencies

COLAB-B01, COLAB-B02.

---

## COLAB-C02 — Lightweight presence

**Status:** `[ ]`

### Summary

Show **who’s viewing** a project and **who’s working on** a task (ephemeral). Supabase Realtime presence on project channel.

### Technical spec

**Channels:**

- `presence:project:{projectId}` — list of `{ userId, displayName, avatarUrl, route }`
- Task focus: include `taskId` when task overlay open

**UI:**

- `for-you-sidebar.tsx` — avatar stack “3 viewing Blenz” on project row (max 3 + overflow)
- `task-board-view.tsx` / project tasks header — “Sandeep is viewing”
- Task overlay — “Jastej is working on this” when same `taskId`

**Ephemeral:** clear on disconnect; no DB persistence.

### Onboarding

**Feature ID:** `presence`  
**Trigger:** First time 2+ users in same project (or simulate in dev).  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | See who’s in the room |
| Body | Avatars show who’s viewing a project or focused on a task — live, not another notification. |
| CTA | Got it |

**Animation — `PresenceAvatarsPreview`:**

1. Three avatars scale in with stagger.
2. Green dot pulse on each (online).
3. Fourth avatar slides in from right (“+1”).
4. Task row shows second avatar ghost badge “also viewing”.

### Acceptance criteria

- [ ] Presence updates within 5s
- [ ] Leaves on tab close / navigate away
- [ ] No presence on personal inbox tasks
- [ ] Respects reduced motion (static avatars)

### Dependencies

Supabase Realtime presence enabled.

---

## COLAB-C03 — Smart capture defaults (extended)

**Status:** `[ ]`

### Summary

Extend `deriveTaskCreateDefaults` and quick-add context for **asset**, **For You**, and **comment** surfaces.

### Context rules

| Context | Defaults |
|---------|----------|
| Asset overlay | `projectId`, label from asset tag, link asset on create |
| For You mention item | `assigneeId: me`, quote comment in description, link asset if applicable |
| Project home | `projectId`, first section |
| For You task mention | open task’s project, same labels |

### Onboarding

**Feature ID:** `smart-capture`  
**Trigger:** First quick add opened from asset overlay or For You inline.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Context-aware tasks |
| Body | Quick add knows where you are — project, asset, and labels pre-fill so you type less. |
| CTA | Got it |

**Animation — split screen: asset on left, quick add on right with chips auto-filling one by one.

### Acceptance criteria

- [ ] Each context applies correct defaults
- [ ] User can override all fields
- [ ] Asset link auto-created when from asset context

### Dependencies

COLAB-A02, COLAB-B01, COLAB-B03.

---

## COLAB-C04 — Snooze & mark handled (For You triage)

**Status:** `[ ]`

### Summary

**Snooze** For You items (reappear tomorrow). **Mark handled** dismisses without resolving underlying thread (user choice).

### Technical spec

**Storage V1:** `localStorage` `fsh-for-you-snooze:{userId}` map itemId → wakeAt  
**V2:** `hub_for_you_dismissals` table for cross-device

**UI:**

- Row actions: clock (snooze), check (handled)
- Snooze options: Later today, Tomorrow, Next week

### Onboarding

**Feature ID:** `for-you-triage`  
**Trigger:** First time user has 5+ items in Needs you.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Triage on your terms |
| Body | **Snooze** brings items back later. **Handled** clears them from your queue without closing the thread. |
| CTA | Got it |

**Animation — row slides right with clock icon (snooze), or fades with check (handled).

### Acceptance criteria

- [ ] Snoozed items hidden until wake time
- [ ] Handled items hidden until new activity
- [ ] Counts update correctly

### Dependencies

COLAB-A01.

---

## COLAB-C05 — Split pane: task + asset preview (desktop)

**Status:** `[ ]`

### Summary

On desktop, task overlay with linked assets can show **side-by-side** asset preview (read-only) without full navigation.

### Technical spec

- `task-detail-overlay.tsx` — when `linkedAssets.length > 0` and `viewport >= 1024`, split layout
- Left: task fields + comments
- Right: `AssetPreviewPane` (image/video, no comment thread)
- Resizable divider optional (v2)

### Onboarding

**Feature ID:** `split-pane-task-asset`  
**Trigger:** First open of task with 1+ linked assets on desktop.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | Task and asset, side by side |
| Body | Linked creative stays visible while you update the task or reply — no tab hopping. |
| CTA | Got it |

**Animation — panel split wipe L→R revealing asset; task text cursor blink.

### Acceptance criteria

- [ ] Split only desktop
- [ ] Mobile keeps stacked navigation
- [ ] Asset preview loads efficiently

### Dependencies

COLAB-B01, COLAB-A03.

---

## COLAB-C06 — Board columns aligned to creative workflow

**Status:** `[ ]`

### Summary

Optional **project task board presets** with creative-ops column names: `Not started` | `In progress` | `In review` | `Waiting on client` | `Done`.

### Technical spec

- Seed sections on project creation (opt-in template)
- `task-board-view.tsx` — already section-based; document default names
- Filter presets in `hub_filters` for “In review”, “Waiting on client”

### Onboarding

**Feature ID:** `creative-board`  
**Trigger:** First switch to board layout on a project with default sections.  
**Steps:** 1

| Field | Value |
|-------|-------|
| Title | A board that speaks creative |
| Body | Columns match how campaigns move — review, client waits, done. Drag tasks as work flows. |
| CTA | Got it |

**Animation — reuse `BoardPreviewHero` from `tasks-empty-state.tsx` with column names above; card drags from “In review” → “Done” with strike-through on landing.

### Acceptance criteria

- [ ] Template sections creatable on new project
- [ ] Board view shows columns
- [ ] Drag reorder still works

### Dependencies

Existing board view.

---

# Cross-cutting: Empty state & onboarding index

## Empty states to build/update

| Component | Variant | When |
|-----------|---------|------|
| `TasksEmptyState` | (existing) | Reference only |
| `ForYouEmptyState` | `needs-you`, `waiting-on-others`, `following`, `your-uploads` | Per lens |
| `AssetTasksEmptyState` (new) | default | Asset has no linked tasks |
| `TaskAssetsEmptyState` (new) | default | Task has no linked assets |
| `FollowingEmptyState` | — | B04 |

## Onboarding feature ID registry

| Feature ID | Phase | Steps | Trigger summary |
|------------|-------|-------|-----------------|
| `needs-you-feed` | A | 2 | First `/for-you` visit |
| `global-quick-add` | A | 1 | First `Q` or FAB |
| `task-deep-link` | A | 1 | First task click from For You |
| `task-visibility` | A | 2 | First personal task / assign |
| `promote-task` | A | 1 | First “Move to project” |
| `task-asset-link` | B | 2 | First asset tasks panel |
| `comment-to-task` | B | 1 | First comment menu hover |
| `for-you-inline-reply` | B | 1 | First expand in For You |
| `for-you-lenses` | B | 2 | Lenses ship |
| `task-watch` | B | 1 | Comment on others’ task |
| `thread-resolve-loop` | C | 1 | Complete linked task |
| `presence` | C | 1 | 2+ users in project |
| `smart-capture` | C | 1 | Quick add from asset/For You |
| `for-you-triage` | C | 1 | 5+ Needs you items |
| `split-pane-task-asset` | C | 1 | Desktop task with assets |
| `creative-board` | C | 1 | First board view |

## Illustration component checklist

| Component file | Used by |
|----------------|---------|
| `needs-you-feed-preview.tsx` | A01 |
| `privacy-feed-preview.tsx` | A01 step 2 |
| `global-quick-add-preview.tsx` | A02 |
| `task-deep-link-preview.tsx` | A03 |
| `visibility-badge-preview.tsx` | A04 |
| `assign-confirm-preview.tsx` | A04 |
| `promote-task-preview.tsx` | A05 |
| `asset-tasks-panel-preview.tsx` | B01 |
| `task-asset-strip-preview.tsx` | B01 |
| `comment-to-task-preview.tsx` | B02 |
| `inline-reply-preview.tsx` | B03 |
| `lenses-tab-preview.tsx` | B04 |
| `task-watch-preview.tsx` | B05 |
| `resolve-loop-preview.tsx` | C01 |
| `presence-avatars-preview.tsx` | C02 |
| `smart-capture-preview.tsx` | C03 |
| `for-you-triage-preview.tsx` | C04 |
| `split-pane-preview.tsx` | C05 |
| `creative-board-preview.tsx` | C06 |

---

# Master progress tracker

Copy status to `[x]` when complete.

## Phase A

- [x] COLAB-A01 — Unified “Needs you” feed
- [x] COLAB-A02 — Global Quick Add + `Q` shortcut
- [x] COLAB-A03 — Task deep links + overlay from For You
- [x] COLAB-A04 — Task visibility badges + assign confirmation
- [x] COLAB-A05 — Promote personal task to project

## Phase B

- [x] COLAB-B01 — Task ↔ asset linking
- [x] COLAB-B02 — Create task from asset comment
- [x] COLAB-B03 — Inline reply from For You
- [x] COLAB-B04 — Collaboration lenses
- [x] COLAB-B05 — Task watchers / Following backend

## Phase C

- [x] COLAB-C01 — Thread → task → resolve loop
- [x] COLAB-C02 — Lightweight presence
- [x] COLAB-C03 — Smart capture defaults (extended) — asset overlay, For You, comment context + global quick add
- [x] COLAB-C04 — Snooze & mark handled (full snooze picker: later today / tomorrow / next week)
- [x] COLAB-C05 — Split pane task + asset (desktop) — read-only AssetPreviewPane
- [x] COLAB-C06 — Creative workflow board presets

## Shared infrastructure

- [x] Collaboration onboarding storage + host (all 16 feature flows + event-driven triggers)
- [x] Illustration components (core set in `collaboration-onboarding-illustration.tsx`)
- [x] `taskDeepLinkPath` + `forYouLensPath` routes
- [x] Dev-tools: replay collaboration onboarding

---

# Agent execution notes

1. **Run migrations in order** — `018_*` for task-assets, `019_*` for comment `linked_task_id`, etc.
2. **Test RLS** with two users: personal inbox must not leak across accounts.
3. **Mobile first** — every overlay/onboarding must work at 375px width.
4. **Do not add Slack/email notifications** — PRD non-goal for v1.
5. **Match hub visual language** — `hub-foreground`, `hub-primary`, `font-display`, bordered cards with `rounded-[5px]`.
6. After each phase, smoke test: create personal task → assign → promote → link asset → comment → complete → resolve.

---

*End of spec.*
