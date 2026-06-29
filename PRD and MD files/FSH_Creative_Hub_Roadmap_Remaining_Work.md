# FSH Creative Hub — Roadmap & Remaining Work

**Version:** 1.0  
**Status:** Ready for implementation  
**Owner:** FSH Design / Product  
**Related docs:** `FSH_Creative_Hub_PRD.md`, `Collaboration_Features_Implementation_Spec.md`, `Hub_Overlay_UI_Style.md`, `Todoist_Feature_Reference.md`

---

## How to use this document

This is the **single source of truth for everything not yet built** after the collaboration loop, mobile parity, search, ideas/canvas bridge, versioning v1, and landing-page collaboration sections.

For each feature:

1. Read **Why it matters** and **Who it's for**.
2. Follow the **End-to-end user flows** — they describe the full journey (UI → server actions → database → realtime → revalidation).
3. Implement **Technical spec** in order: schema → RLS → queries/actions → UI → onboarding (if any).
4. Pass **Acceptance criteria** before marking done.
5. Update the **Master progress tracker** at the bottom.

### Conventions (match shipped hub quality)

| Area | Reference |
|------|-----------|
| Overlay / dialog density | `Hub_Overlay_UI_Style.md`, `HubDialog`, `HubConfirmDialog` |
| Collaboration onboarding | `src/lib/collaboration-onboarding/`, `collaboration-onboarding-host.tsx` |
| Server actions pattern | `src/lib/workspace/actions.ts`, `src/lib/tasks/actions.ts` |
| RLS helpers | `hub_can_edit`, `hub_is_member`, migrations `001`–`021` |
| Routes | `src/lib/routes.ts` |
| Landing feature sections | `src/components/landing/feature-showcase.tsx` |
| Motion | Framer Motion, `useReducedMotion()`, easing `[0.22, 1, 0.36, 1]` |

### Brand voice (copy)

- **Confident, warm, precise** — “Hand it to the room,” not “Leverage stakeholder alignment.”
- **Creative-ops native** — campaigns, sections, final picks, consensus — not generic SaaS.
- **Short headlines, human body** — mirror landing page feature sections.
- **Monospace kickers** — `FOR YOU`, `CLIENT SHARE`, uppercase tracking.

---

## What is already shipped (baseline)

Do not re-build these. Extend them.

| Area | Shipped capability | Key paths |
|------|-------------------|-----------|
| **Review loop** | Upload, grid, overlay, comments, @mentions, reactions, approve/reject/final, presentation | `project-workspace.tsx`, `asset-detail-overlay.tsx` |
| **Projects & files** | Review boards, canvas, text docs, favorites, trash | `hub_project_files`, `project-files/` |
| **For You** | Needs-you feed, lenses, snooze, inline reply, priority kinds | `for-you-list.tsx`, `lib/inbox/` |
| **Tasks** | Inbox, today, upcoming, labels, filters, creative board presets, quick add `Q` | `tasks-workspace-client.tsx`, `016_hub_tasks.sql` |
| **Collaboration loop** | Comment → task, task ↔ asset link, complete → resolve, promote inbox → project | Collaboration spec Phases A–C ✅ |
| **Presence** | Project + task viewers via Supabase Realtime | `lib/presence/` |
| **Split pane (v1)** | Read-only asset preview in task overlay (desktop) | `asset-preview-pane.tsx` |
| **Ideas** | Canvas whiteboard per initiative, sticky → task | `ideas-canvas-board.tsx`, `ideas-canvas-bridge.tsx` |
| **Versioning v1** | Asset in-place versions (`variant_of`), doc revision snapshots, RPC hardening | `021_hub_asset_versioning_hardening.sql` |
| **Search** | Projects, files, doc body, assets, tasks | `lib/search/queries.ts` |
| **Mobile** | Global bottom nav, tasks top chips, ideas/assets bridge on phone | `hub-mobile-bottom-nav.tsx` |
| **Landing** | 8 feature sections (incl. For You, Quick Tasks, Collaboration) + animated illustrations | `feature-showcase.tsx` |

**Explicitly deferred by product decision:** full client portal (#7), Slack/email notifications (PRD non-goal v1).

---

## Priority overview

| Phase | Theme | Outcome |
|-------|-------|---------|
| **D** | Client delivery | Share work outside the team without losing control |
| **E** | Collaboration depth | Task ↔ asset becomes a true dual workspace |
| **F** | Tasks maturity | Todoist-depth for daily creative ops |
| **G** | Canvas & creative surface | Whiteboard history + template completeness |
| **H** | Versioning v2 | Compare, diff, trust at scale |
| **I** | Polish, performance & trust | Production-grade feel |
| **J** | Platform & integrations | Notifications + external hooks |

Recommended build order: **D → I (critical paths) → E → F → G → H → J**.

---

# Phase D — Client delivery

> *“Creative review shouldn’t live in 40 Slack messages.”*  
> Phase D finishes the sentence: *“…so hand clients a link instead.”*

---

## ROAD-D01 — View-only share links (presentation & assets)

**Status:** `[x]`  
**Priority:** P0 — highest product impact  
**Depends on:** Presentation mode (`presentation-mode.tsx`), asset overlay, RLS

### Why it matters

Internal presentation mode is strong, but every client review still requires a screen-share or export. A **tokenized view-only link** lets FSH share a curated reel or single asset without granting hub access.

### Who it's for

| Role | Need |
|------|------|
| **Editor** | Share “here’s round 2” without adding client to Supabase |
| **Client / stakeholder** | View and optionally comment (D02) without onboarding |
| **Admin** | Revoke links, set expiry, audit access |

### End-to-end user flows

#### Flow 1 — Share presentation reel

```
Editor (authenticated)
  → Opens review board → Presentation mode
  → Clicks "Share link" in toolbar
  → Modal: name link, optional expiry (7d / 30d / never), include sections filter
  → Server: create hub_share_links row + signed token
  → UI: copy URL https://hub.fshdesign.org/share/{token}
  → Editor sends link (email/Slack manually)

Client (unauthenticated)
  → Opens /share/{token}
  → Middleware: validate token, no auth required
  → Server: load share scope (presentation assets for initiative/board)
  → UI: stripped presentation viewer — no hub chrome, no internal comments
  → Optional: FSH logo, project name, "Shared by {name}"
```

#### Flow 2 — Share single asset

```
Editor → Asset overlay → "Share" (next to Ideas / Add task)
  → Same modal, scope = single asset + thread visibility toggle (comments on/off)
  → Client opens link → full-screen asset + approved comment thread (read-only) if enabled
```

#### Flow 3 — Revoke & rotate

```
Admin/Editor → Project settings → Shared links table
  → Revoke → token invalid immediately
  → Rotate → new token, old 410 Gone
```

### Technical spec

#### Database (`022_hub_share_links.sql`)

```sql
create table public.hub_share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.hub_projects(id) on delete cascade,
  created_by uuid not null references public.hub_profiles(id),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  scope_type text not null check (scope_type in ('presentation', 'asset', 'board')),
  scope_id uuid not null, -- board_id, asset_id, or initiative_id depending on type
  config jsonb not null default '{}', -- { showComments, statusFilter, assetIds[] }
  expires_at timestamptz,
  revoked_at timestamptz,
  view_count int not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index hub_share_links_token_idx on public.hub_share_links (token) where revoked_at is null;
```

#### RLS

- **Authenticated:** editors can CRUD links for their projects.
- **Anonymous:** no direct table access — all public reads go through **security definer** RPC `hub_resolve_share_token(p_token)` that returns only whitelisted asset fields.

#### API / routes

| Route | Purpose |
|-------|---------|
| `GET /share/[token]` | Public page (SSR) |
| `POST /api/share` | Create link (auth) |
| `DELETE /api/share/[id]` | Revoke (auth) |

#### Server actions

- `createShareLinkAction({ projectId, scopeType, scopeId, config, expiresAt })`
- `revokeShareLinkAction(linkId)`
- `recordShareViewAction(token)` — increment view_count (rate-limited)

#### Frontend

| Component | Location |
|-----------|----------|
| `ShareLinkDialog` | `src/components/workspace/share-link-dialog.tsx` |
| `ShareLinksManager` | project settings or board toolbar |
| `PublicShareViewer` | `src/app/share/[token]/page.tsx` |
| `PublicPresentationMode` | fork of `presentation-mode.tsx` without edit affordances |

#### Middleware

- Add `/share/*` to public routes in `src/lib/supabase/middleware.ts`.
- Do **not** expose hub nav, quick add, or project list on share routes.

### Edge cases & security

- Expired/revoked token → branded 404 (“This link has expired”).
- Asset deleted → share returns graceful empty state.
- **Never** leak other project assets via token enumeration.
- Rate-limit view recording per IP.
- Optional password (phase D01b): `config.passwordHash` — stretch goal.

### Acceptance criteria

- [x] Editor creates presentation share link in &lt; 3 clicks.
- [x] Client opens link on mobile without login; reel advances smoothly.
- [x] Revoked link fails within 60s (no CDN cache of private media without signed URLs).
- [x] RLS: anonymous cannot query `hub_assets` directly.
- [x] Activity log: `shared` verb when link created (extend `hub_activity` check).

### Copy (on brand)

- **Modal title:** “Share with the room”
- **Body:** “Anyone with the link can view — no FSH account needed.”
- **CTA:** “Copy link”
- **Expiry label:** “Link expires”

---

## ROAD-D02 — Client-safe comment mode (optional on share links)

**Status:** `[ ]`  
**Priority:** P1  
**Depends on:** ROAD-D01

### Why it matters

Some clients should react without joining the hub. Controlled guest comments stay on the asset thread without exposing internal task noise.

### End-to-end flow

```
Client on /share/{token} with comments enabled
  → Enters name + email (session cookie, no full auth)
  → Guest comment stored with author_display_name, guest_email, share_link_id
  → Editors see guest comments in overlay with "Guest" badge
  → @mentions disabled for guests; no For You noise
```

### Technical spec

- Extend `hub_comments` with nullable `guest_email`, `share_link_id`, or separate `hub_guest_comments` table (prefer separate for RLS simplicity).
- RLS: insert only when valid share token presented in RPC.
- Moderation: editors can hide/delete guest comments.

### Acceptance criteria

- [ ] Guest can leave one thread-level comment without account.
- [ ] Guest cannot access other project data.
- [ ] Editor can disable guest comments per link.

---

## ROAD-D03 — External collaborator invites (beyond @fshdesign.org)

**Status:** `[ ]`  
**Priority:** P1  
**Depends on:** Auth, `invite-members-dialog.tsx`

### Why it matters

Invite dialog currently notes external collaborators need a “separate share link (coming soon).” Agencies and clients often need **viewer/editor** access inside the hub for long engagements.

### End-to-end flow

```
Admin → Invite → enters external email
  → If domain !== fshdesign.org → offer roles: Viewer only (default) or Editor (confirm)
  → Supabase invite email OR magic link with project scope
  → External user signs in → lands in single project (no org-wide list if not hub admin)
  → RLS: hub_project_members enforces scope
```

### Technical spec

- Relax `validateInviteEmail` in `lib/email` for allowlisted domains per project (`hub_project_allowed_domains` jsonb on project).
- Project setting UI: “Trusted domains” + one-off external emails.
- Audit: `hub_activity` verb `invited`.

### Acceptance criteria

- [ ] External viewer sees only invited projects.
- [ ] External user cannot enumerate org-wide projects.
- [ ] Admin can remove external member.

---

# Phase E — Collaboration depth

---

## ROAD-E01 — Interactive split pane (task + asset)

**Status:** `[ ]`  
**Priority:** P1  
**Depends on:** `asset-preview-pane.tsx` (read-only v1), `task-detail-overlay.tsx`

### Why it matters

Today the split pane **shows** the linked asset but forces a context switch to comment or vote. Creative leads live in the task list during crunch — they need the full overlay capabilities docked beside the task.

### End-to-end flow

```
User opens task with linked assets (desktop, ≥ lg breakpoint)
  → Split pane shows asset preview (existing)
  → User clicks "Open in pane" or pane is interactive by default
  → Right/bottom pane loads AssetDetailPane (not full overlay):
      - Media, consensus bar, vote, status (if editor)
      - Comment thread + composer
      - Linked tasks (collapsed)
  → User posts comment → addCommentAction → realtime updates
  → User completes task → optional prompt "Resolve linked comment threads?"
  → mark handled in For You
```

### Technical spec

#### Frontend

- `AssetDetailPane` — extract from `asset-detail-overlay.tsx` (shared core).
- Props: `variant: "overlay" | "pane"`.
- Task overlay: resizable split (`react-resizable-panels` or CSS grid).
- Mobile: keep current behavior (no split; link opens full overlay).

#### Backend

- Reuse existing `addCommentAction`, `toggleVoteAction`, `updateAssetStatusAction`.
- No new tables.

#### Onboarding

- Extend `split-pane-task-asset` collaboration onboarding step 2: “Comment without leaving the task.”

### Acceptance criteria

- [ ] Comment from split pane appears on asset for all project members.
- [ ] Pane collapses to thumbnail strip on narrow desktop.
- [ ] No duplicate realtime subscriptions (one channel per asset).

---

## ROAD-E02 — For You → deep action shortcuts

**Status:** `[ ]`  
**Priority:** P2  
**Depends on:** `for-you-list.tsx`

### Why it matters

For You is the action center, but some items still require multiple hops. One-click actions reduce triage friction.

### Flows

| Item kind | Primary action | Secondary |
|-----------|----------------|-----------|
| `vote_requested` | Open asset + focus vote bar | Snooze |
| `mention` | Inline reply (exists) | Open asset |
| `task_assigned` | Open task overlay | Mark complete inline |
| `upload_thread` | Open asset comments | Create task |

### Technical spec

- Extend `ForYouItem` actions in `for-you-list.tsx`.
- `markForYouHandledAction` persistence (if not already server-backed).

### Acceptance criteria

- [ ] Vote from For You card without opening full project workspace.
- [ ] Handled state survives refresh.

---

## ROAD-E03 — Project activity → actionable history

**Status:** `[ ]`  
**Priority:** P2  
**Depends on:** `activity-feed.tsx`, `restored` verb already in DB

### End-to-end flow

```
User opens project → Activity tab
  → Sees verbs: uploaded, commented, voted, final, restored, shared (D01)
  → Clicks row → navigates to asset/task/doc
  → Filter by person / verb / date range
```

### Technical spec

- `getActivityForProject` — add pagination, filters.
- Activity row links via `target_type` + `target_id`.
- Optional: `hub_activity` index on `(project_id, created_at desc)`.

---

# Phase F — Tasks maturity

Reference: `Todoist_Feature_Reference.md` for prioritization language.

---

## ROAD-F01 — Recurring tasks UI

**Status:** `[ ]`  
**Priority:** P1  
**Depends on:** `recurring_rule` column exists, `lib/tasks/recurring.ts`, quick-add parser

### Why it matters

Backend supports recurrence on complete; users cannot set or edit recurrence in the UI. Weekly standups, monthly reports, and campaign cadences need this.

### End-to-end flow

```
User creates/edits task
  → Clicks "Repeat" in task detail or types "every monday" in quick add
  → UI shows recurrence chip: Every Monday / Every 2 weeks / Custom
  → Saves → hub_tasks.recurring_rule = RRULE or hub shorthand JSON
  → On completeTaskAction:
      → computeNextDueDate (exists)
      → Clone task with next due, same labels/section/project
      → Activity: optional task activity log (F02)
```

### Technical spec

- **UI:** `RecurrencePicker` in `task-detail-overlay.tsx`.
- **Parser:** extend `parse-quick-add.ts` for “every day”, “every monday”.
- **Storage:** document grammar in `lib/tasks/recurring.ts`.
- **Edge case:** inbox tasks recurring → prompt to move to project for team visibility.

### Acceptance criteria

- [ ] Complete recurring task spawns next instance.
- [ ] Edit recurrence updates rule without duplicating history.
- [ ] Cancel recurrence clears `recurring_rule`.

---

## ROAD-F02 — Per-task activity log

**Status:** `[ ]`  
**Priority:** P2  
**Depends on:** `hub_tasks`, task comments

### End-to-end flow

```
User opens task → "Activity" tab
  → Timeline: created, assigned, due changed, completed, reopened, linked asset, comment added
  → Each row: actor avatar, relative time, diff summary
```

### Technical spec

```sql
create table public.hub_task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.hub_tasks(id) on delete cascade,
  actor_id uuid references public.hub_profiles(id),
  verb text not null,
  summary text not null,
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);
```

- Triggers or action-layer inserts on `updateTaskAction`, `completeTaskAction`, link/unlink asset.
- RLS: same as parent task visibility.

---

## ROAD-F03 — Calendar view

**Status:** `[ ]`  
**Priority:** P2  

### End-to-end flow

```
User → Tasks → Calendar tab (or /tasks/calendar)
  → Month/week grid, tasks on due_at
  → Drag task to new day → updateTaskAction(dueAt)
  → Click day → filtered list sidebar
```

### Technical spec

- Route: `TASKS_CALENDAR_PATH`, `tasks/calendar/page.tsx`.
- Query: `getTasksForCalendar(supabase, userId, range)`.
- UI: lightweight month grid — no heavy calendar lib required for v1.

---

## ROAD-F04 — Time reminders

**Status:** `[ ]`  
**Priority:** P3  

### End-to-end flow

```
User sets reminder on task → datetime
  → Stored in hub_task_reminders
  → Cron/Edge Function scans due reminders
  → Delivers via in-app notification (J01) — not email in v1
```

### Technical spec

- Table `hub_task_reminders(task_id, remind_at, delivered_at)`.
- Supabase Edge Function `dispatch-reminders` on schedule.

---

## ROAD-F05 — Natural-language filter assist

**Status:** `[ ]`  
**Priority:** P3  

### Flow

```
User types in filter bar: "high priority design tasks due this week"
  → Parser → hub_filters query JSON
  → Saves as named filter (optional)
```

---

# Phase G — Canvas & creative surface

---

## ROAD-G01 — Canvas version snapshots

**Status:** `[ ]`  
**Priority:** P2  
**Depends on:** Doc revisions pattern (`lib/documents/revisions.ts`)

### Why it matters

Ideas whiteboard and open canvas have undo in-session only. Campaign brainstorms need “what did we land on Tuesday?”

### End-to-end flow

```
Editor on canvas → "History" in toolbar
  → Save snapshot (manual) or auto on publish/close (config)
  → Snapshot stored in hub_project_files.config.revisions[] (same shape as docs)
  → Restore → replaces nodes/links, preserves current as backup revision
```

### Technical spec

- Reuse `appendDocumentRevision` pattern adapted for `CanvasConfig`.
- `saveCanvasRevisionAction`, `restoreCanvasRevisionAction` in `project-files/actions.ts`.
- UI: `CanvasRevisionsMenu` mirroring `document-revisions-menu.tsx`.

---

## ROAD-G02 — Sticky bullet lists

**Status:** `[ ]`  
**Priority:** P3  
**Depends on:** `sticky-format-toolbar.tsx` (marked coming soon)

### Flow

```
User selects sticky → bullet list toggle
  → Inserts "• " at line starts or wraps lines in list markup
  → Persisted in sticky node text / format flags
```

---

## ROAD-G03 — Project templates (ship, don't tease)

**Status:** `[ ]`  
**Priority:** P2  
**Depends on:** `template-coming-soon-dialog.tsx`

### End-to-end flow

```
User creates project → picks template: Campaign / Menu refresh / Social pack
  → Server seeds: review board sections, sample initiatives, optional canvas/doc
  → User lands in project with structure ready
```

### Technical spec

- `hub_project_templates` seed data or JSON in `lib/project-files/templates/`.
- `createProjectFromTemplateAction`.

---

# Phase H — Versioning v2

Building on `021_hub_asset_versioning_hardening.sql`.

---

## ROAD-H01 — Side-by-side asset compare

**Status:** `[ ]`  
**Priority:** P2  

### End-to-end flow

```
Editor → Asset overlay → Version history
  → Select two versions → "Compare"
  → Full-screen or split view: v2 left, v3 right
  → Slider mode for images; sync play for video
  → No diff pixels required for v1 — visual side-by-side is enough
```

### Technical spec

- `AssetVersionCompare` component.
- Load two `public_url` from `getAssetVersionHistory`.

---

## ROAD-H02 — Auto document revision on publish

**Status:** `[ ]`  
**Priority:** P3  

### Flow

```
User edits doc → on blur idle 30s or explicit "Save"
  → If change threshold met → auto append revision labeled "Auto-save {time}"
  → Cap at 20 revisions (existing)
```

---

## ROAD-H03 — Media garbage collection

**Status:** `[ ]`  
**Priority:** P2  

### Why it matters

Version uploads and deletes leave orphaned files in `hub-media`.

### Technical spec

- Edge Function or cron: list storage objects not referenced by any `hub_assets.storage_path` or `variant_of` chain.
- Dry-run report for admins → delete after 7-day grace.

---

# Phase I — Polish, performance & trust

---

## ROAD-I01 — Destructive action consistency

**Status:** `[x]`  
**Priority:** P1  

### Scope

Replace any remaining `window.confirm` patterns with `HubConfirmDialog` for:

- Delete initiative / section
- Delete project file (canvas, doc, board)
- Bulk asset delete
- Remove project member

**Reference:** `task-detail-overlay.tsx` (done for task delete/promote).

---

## ROAD-I02 — Error boundaries & failed state UX

**Status:** `[x]`  
**Priority:** P1  

### Scope

- Wrap route segments: projects, for-you, tasks, share (D01).
- Standard `HubErrorState` component: message + retry + go home.
- Search: timeout message (partial — extend `hub-search.tsx`).
- Upload: resumable/retry for large video.

---

## ROAD-I03 — Virtualized review board grid

**Status:** `[ ]`  
**Priority:** P2  

### When

Initiative has 50+ assets; scroll jank on mobile.

### Technical spec

- `@tanstack/react-virtual` in `ReviewBoardSectionAssets`.
- Preserve `highlightAssetId` scroll-into-view behavior.

---

## ROAD-I04 — Global search on detail routes

**Status:** `[ ]`  
**Priority:** P3  

### Flow

User in doc/canvas → keyboard `/` or header icon → command palette search (existing API).

`hub-header.tsx` currently hides search on detail paths — add compact palette overlay instead.

---

## ROAD-I05 — E2E test suite (collaboration loop)

**Status:** `[x]`  
**Priority:** P1  

### Critical path (Playwright)

1. User A creates personal task in inbox.
2. Promotes to project.
3. Links asset.
4. User B comments on asset.
5. User A creates task from comment.
6. Completes task.
7. Resolves comment thread.
8. Assert For You item cleared.

### Secondary

- RLS two-user fixture via Supabase service role in CI.
- Version upload + restore smoke test.

---

## ROAD-I06 — PRD & docs sync

**Status:** `[ ]`  
**Priority:** P2  

Update `FSH_Creative_Hub_PRD.md` non-goals:

- ✅ Versioning (basic) — shipped.
- ✅ Tasks app — shipped.
- ⏳ Client portal — Phase D.
- ⏳ Notifications — Phase J.

---

# Phase J — Platform & integrations

---

## ROAD-J01 — In-app notification center

**Status:** `[ ]`  
**Priority:** P1  

### Why it matters

For You is the feed, not a durable notification inbox. Users need “what happened while I was away” without scanning lenses.

### End-to-end flow

```
Event occurs (mention, assign, reply, share view D01)
  → insert hub_notifications
  → Bell icon in hub-nav shows unread count
  → Panel lists notifications grouped by day
  → Click → deep link (task, asset, for-you item)
  → Mark read / mark all read
```

### Technical spec

```sql
create table public.hub_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.hub_profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
```

- Realtime optional: `user_id=eq.{id}` subscription.
- Generate from existing actions (comment mention parser, assignee change).

---

## ROAD-J02 — Slack webhook (optional)

**Status:** `[ ]`  
**Priority:** P3  
**Note:** PRD non-goal — implement only if team requests.

### Flow

```
Project settings → Slack webhook URL
  → On final pick / new comment @channel → POST slack message with deep link
```

---

## ROAD-J03 — Meeting notes → tasks (future)

**Status:** `[ ]`  
**Priority:** P4  

Placeholder for AI / manual import pipeline referenced in `Todoist_Feature_Reference.md`. Out of scope until capture source exists.

---

# Landing & marketing follow-ups

---

## ROAD-L01 — Loom tutorials for collaboration sections

**Status:** `[x]` *(URLs pending user input — `feature-looms.ts` left null; sections render without Quick tutorial link as designed)*  

Record and paste URLs into `src/lib/landing/feature-looms.ts`:

- `forYou`
- `quickTasks`
- `collaborationLoop`

Until set, sections render without Quick tutorial link (intentional).

---

## ROAD-L02 — Hero & problem strip refresh

**Status:** `[ ]`  

Optional copy pass to mention For You + tasks in hero verbs or problem strip — keep short.

---

# Master progress tracker

Copy `[ ]` → `[x]` when complete.

## Phase D — Client delivery

- [x] ROAD-D01 — View-only share links
- [ ] ROAD-D02 — Client-safe guest comments
- [ ] ROAD-D03 — External collaborator invites

## Phase E — Collaboration depth

- [ ] ROAD-E01 — Interactive split pane
- [ ] ROAD-E02 — For You deep actions
- [ ] ROAD-E03 — Actionable activity history

## Phase F — Tasks maturity

- [ ] ROAD-F01 — Recurring tasks UI
- [ ] ROAD-F02 — Per-task activity log
- [ ] ROAD-F03 — Calendar view
- [ ] ROAD-F04 — Time reminders
- [ ] ROAD-F05 — NL filter assist

## Phase G — Canvas & creative surface

- [ ] ROAD-G01 — Canvas version snapshots
- [ ] ROAD-G02 — Sticky bullet lists
- [ ] ROAD-G03 — Project templates

## Phase H — Versioning v2

- [ ] ROAD-H01 — Side-by-side asset compare
- [ ] ROAD-H02 — Auto doc revision
- [ ] ROAD-H03 — Media garbage collection

## Phase I — Polish, performance & trust

- [x] ROAD-I01 — Destructive action consistency
- [x] ROAD-I02 — Error boundaries
- [ ] ROAD-I03 — Virtualized grid
- [ ] ROAD-I04 — Search on detail routes
- [x] ROAD-I05 — E2E test suite
- [ ] ROAD-I06 — PRD sync

## Phase J — Platform & integrations

- [ ] ROAD-J01 — In-app notification center
- [ ] ROAD-J02 — Slack webhook
- [ ] ROAD-J03 — Meeting notes → tasks

## Landing

- [x] ROAD-L01 — Loom URLs *(pending user recordings)*
- [ ] ROAD-L02 — Hero copy refresh

---

# Appendix A — Suggested implementation waves

| Wave | Duration (rough) | Items | Team outcome |
|------|------------------|-------|--------------|
| **Wave 1** | 2–3 weeks | D01, I01, I02, I05, L01 | Client links + production trust |
| **Wave 2** | 2 weeks | E01, J01, D03 | Daily workflow speed + invites |
| **Wave 3** | 2–3 weeks | F01, F02, F03, G03 | Tasks + templates feel complete |
| **Wave 4** | 2 weeks | H01, G01, I03 | Power features + scale |
| **Wave 5** | as needed | D02, F04, F05, J02, H02, H03 | Nice-to-haves |

---

# Appendix B — Codebase map (quick reference)

```
src/
├── app/
│   ├── landing/          # Public marketing
│   ├── for-you/          # Collaboration inbox
│   ├── tasks/            # Task app views
│   └── projects/         # Project workspace, boards, canvas, docs
├── components/
│   ├── landing/          # Feature showcase, illustrations
│   ├── hub/              # Shell, nav, search
│   ├── workspace/        # Review board, asset overlay, versioning
│   ├── tasks/            # Task UI, split pane
│   ├── inbox/            # For You
│   └── collaboration-onboarding/
└── lib/
    ├── workspace/        # Asset actions, queries, versions
    ├── tasks/            # Task actions, quick-add, recurring
    ├── inbox/            # For You queries
    ├── search/           # Hub search
    └── project-files/    # Docs, canvas, boards

supabase/migrations/      # 001–021 shipped; start 022+ for roadmap
```

---

# Appendix C — Agent execution notes

1. **Migrations via Supabase MCP** — apply DDL with `apply_migration`; never skip RLS policies.
2. **Two-user RLS tests** — mandatory for D01 (anonymous), D03 (external), F inbox privacy.
3. **Mobile first** — every new overlay must work at 375px; share links especially.
4. **Match hub visual language** — `hub-paper`, `hub-primary`, `rounded-[6px]` controls, `HubDialog` density.
5. **No scope creep** — ship D01 before D02; ship read-only share before guest comments.
6. **Activity verbs** — extend `hub_activity_verb_check` when adding new verbs (`shared`, `invited`, etc.).

---

*This document supersedes informal gap-analysis notes for all post-v1 work. Update the master tracker as features ship.*
