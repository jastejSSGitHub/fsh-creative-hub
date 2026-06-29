# Todoist Feature Reference → FSH Tasks Build Spec

**Purpose:** A faithful, well-documented breakdown of Todoist's functionality, adapted into a
build spec for the FSH Creative Hub task module. Captured from Todoist's public docs, help
center, and feature pages. Use alongside the screenshots in `Ui references/Todoist/`.

> Scope note: build a *faithful core*, not every paid/edge feature. Todoist has ~10 years of
> accretion (Karma, location reminders, voice "Ramble", email-to-task, dozens of integrations).
> Most of that is noise for an internal agency tool. The spec below marks each feature
> **[CORE]**, **[NICE]**, or **[SKIP]** so Cursor builds the right 20% that delivers 80%.

---

## 1. The Object Model (this is the heart of it)

Todoist's power is a clean nested hierarchy. Mirror this exactly.

```
Workspace (FSH)
└── Projects                         (e.g. "Blenz", "Healthy Cart", or "Design Team")
    ├── Sub-projects (nested)         [NICE] up to a few levels
    └── Sections                      (e.g. "Research", "In Progress", "Launch")
        └── Tasks
            └── Sub-tasks             (Todoist allows 4 indent levels)
                └── ...
```

**Key rules from Todoist:**
- Tasks live in a project; default catch-all is the **Inbox** (tasks with no project). **[CORE]**
- Sections divide a project into stages/groups. Todoist advises 3–5 sections per project. **[CORE]**
- Sub-tasks nest up to **4 indent levels**; beyond that, use sections instead. **[CORE for 1–2 levels]**
- Drag to indent (left/right) turns a task into a sub-task; both must be in the same project. **[CORE]**
- Sub-tasks have their own due dates, labels, priority, assignee. **[CORE]**

---

## 2. The Task Object — every field

| Field | Detail | Tier |
|---|---|---|
| Name | Short, starts with a verb ("Review homepage"). | CORE |
| Description | Longer notes, links, context — separate from name. | CORE |
| Due date | When you plan to *work on it*. Natural-language parsed. | CORE |
| Deadline | When it must be *delivered* (distinct from due date). Paid in Todoist. | NICE |
| Priority | P1 (urgent/red) → P4 (none/default). | CORE |
| Labels | Tags across projects (@design, @urgent, @quick). | CORE |
| Project | Where it lives. | CORE |
| Section | Sub-group within project. | CORE |
| Assignee | Collaborator the task is delegated to. | CORE |
| Reminders | Time-based; auto-reminder for dated tasks. Location reminders exist. | NICE (time) / SKIP (location) |
| Recurring | "every Monday", "every 2 weeks", "every first Wednesday". | CORE |
| Comments | Per-task threaded comments + file attachments. | CORE |
| Sub-tasks | Nested child tasks. | CORE |
| Activity | Per-task change history. | NICE |
| Task link | Copy a deep link to any task. | CORE |
| Completed state | Check to complete; completing parent + subs clears deadline. | CORE |

---

## 3. Quick Add + Natural Language (Todoist's signature feature)

This is the single most-praised Todoist feature and the biggest reason people stay. **Build it [CORE].**

- Keyboard shortcut **Q** opens Quick Add from anywhere.
- Type the task in one line; symbols parse into structured fields **in real time** with a preview:

| Symbol | Sets | Example |
|---|---|---|
| (plain text) | task name | `Review homepage` |
| date words | due date | `tomorrow`, `next Tuesday 9am`, `Jan 15` |
| `#` | project (and section via `#Project/Section`) | `#Blenz` |
| `@` | label | `@design` |
| `p1`–`p4` | priority (lowercase, no space) | `p1` |
| `+` | assignee | `+Sandeep` |
| `!` | reminder | `!tomorrow 9am` |
| recurring phrases | repeat rule | `every Monday`, `every 2 weeks` |

**Full example:**
`Review homepage mockups tomorrow 9am #Blenz/Design @design +Preeti p1`
→ creates a P1 task "Review homepage mockups", due tomorrow 9am, in Blenz project /
Design section, labeled @design, assigned to Preeti.

**Recurring grammar notes (build the common cases):**
- Works: `every day`, `every Monday`, `every 2 days`, `every 2 weeks`, `every first Wednesday`,
  `every other Tuesday`, `once a year on Jan 15`, `every Sunday at 8pm`, start dates like `every! Monday starting next month`.
- Does NOT work in Todoist: "bi-weekly" (use `every 2 weeks`), "every other day" (use `every 2 days`).
- Put dates at the END of the task name for reliable parsing.

**Paste-to-tasks:** Copy a multi-line list, paste into Todoist → each line becomes a separate task.
**[NICE — and directly relevant to the future meeting-analyzer feed.]**

> Implementation: use a natural-language date parser (e.g. `chrono-node`) plus simple regex for
> `#`, `@`, `p1-4`, `+`. Show the parsed preview as chips below the input, like Todoist does.

---

## 4. Views & Layouts

| View | What it shows | Tier |
|---|---|---|
| **Inbox** | Uncategorized capture space. | CORE |
| **Today** | All tasks dated today (built-in, not editable). | CORE |
| **Upcoming** | Calendar-ish forward view; drag to re-plan days/weeks. | CORE |
| **Project view** | One project's tasks. | CORE |
| **Label view** | All tasks with a given label across projects. | CORE |
| **Filters** | Saved custom queries (see §5). | CORE |
| **Productivity / Karma** | Goals, streaks, completed archive. | SKIP (gamification noise for FSH) |

**Layouts (each view can switch):**
- **List** — classic nested checklist. Sub-tasks only addable inline in list layout. **[CORE]**
- **Board** — Kanban columns from sections; drag cards between. **[CORE — agencies love this]**
- **Calendar** — tasks by date (Todoist paid). **[NICE]**

**Grouping** (in a view): by date, date added, deadline, priority, or label. **[NICE]**

---

## 5. Labels & Filters

**Labels [CORE]:** cross-project tags. For FSH, pre-seed team + context labels:
`@design @marketing @tech @print @backend @urgent @quick @waiting @client @internal`.

**Filters [CORE, simplified]:** saved queries with a small operator language:

| Operator | Meaning | Example |
|---|---|---|
| `&` | AND | `today & p1` |
| `\|` | OR | `@design \| @marketing` |
| `!` | NOT | `!@waiting` |
| `()` | grouping | `(today \| overdue) & @design` |
| `,` | separate lists in one view | `p1 & overdue, p4 & today` |
| `#Project` | in project | `#Blenz` |
| `@label` | has label | `@urgent` |
| `p1-p4` | priority | `p1` |
| date | `today`, `overdue`, `7 days`, `30 days`, `no date` | `7 days & #Blenz` |
| `assigned to: Name` | assignee | `assigned to: Preeti` |
| `*` | wildcard | `@urgent*` |

**FSH preset filters to ship by default:**
- "My Tasks Today" → `today & assigned to: me`
- "Design — This Week" → `7 days & @design`
- "Overdue" → `overdue`
- "Awaiting Client" → `@waiting | @client`
- One per team: `@design`, `@marketing`, `@tech`

> Filter Assist (natural-language → query) is a Todoist Pro AI feature. **[NICE]** — easy to
> replicate later with the Claude API since you'll have it wired anyway.

---

## 6. Collaboration (Todoist Teams model)

| Feature | Detail | Tier |
|---|---|---|
| Shared workspace | Team projects separate from personal. | CORE |
| Share project | Invite members; public (joinable) or private. | CORE |
| Assign tasks | One assignee per task (Todoist limit). | CORE |
| Roles & permissions | Admin manages access; member; guest. | CORE (reuse Hub's admin/editor/viewer) |
| Task comments + files | Threaded, with attachments. | CORE |
| @mention | Notify a collaborator in a comment. | CORE (reuse Hub's @mention + inbox) |
| Activity log | History by project / person / event type. | NICE |

> Big win: the Hub **already has** auth, members, roles, @mentions, and an inbox. The task module
> reuses all of it. You're not rebuilding collaboration — you're adding a task object on top.

---

## 7. Keyboard Shortcuts (desktop power-user layer) [NICE]

| Key | Action |
|---|---|
| `Q` | Quick Add from anywhere |
| `A` | Add task to bottom of list |
| `Shift+A` | Add task to top |
| `F` | Search |
| `J`/`K` or arrows | Move selection between tasks |
| `Ctrl+]` / `Ctrl+[` | Indent / outdent (make sub-task) |
| `Shift+Cmd/Ctrl+C` | Copy link to task |
| `Ctrl/Option+Space` | Global quick-add overlay |

---

## 8. Mobile Design (must match — FSH wants mobile parity)

Todoist's mobile app is a primary reason for its loyalty. Key mobile patterns to replicate:

- **Dynamic Add button** — a floating "+" bottom-right; **tap** to add, or **drag** it to the exact
  spot in the list where the task should go (and drag right = sub-task, far left = new section). **[CORE]**
- **Swipe gestures** — swipe right to select/complete; swipe to schedule. **[CORE]**
- **Full natural-language parsing** in the mobile quick-add field, with the recognized date
  highlighted inline as you type. **[CORE]**
- **Press-and-hold + drag** to reorder and to change indent level. **[CORE]**
- Bottom nav for Today / Upcoming / Browse (projects) / Search. **[CORE]**
- Home-screen widget, voice/Ramble, watch apps. **[SKIP]**
- Offline-first: NL parsing happens on-device; sync on reconnect. **[NICE — Supabase handles sync]**

---

## 9. Things to deliberately SKIP for FSH

These exist in Todoist but add complexity without serving an internal agency tool:
- Karma / gamification / productivity streaks
- Location-based reminders
- Voice ("Ramble"), watch apps, home-screen widgets
- Email-to-task / forwarding addresses
- The full third-party integration marketplace (Zapier/IFTTT)
- Templates marketplace (you already said: avoid Canva-ification)

---

## 10. FSH Task Module — Recommended Build (synthesis)

**Object model:** Workspace → Projects (reuse Hub projects!) → Sections → Tasks → Sub-tasks (2 levels).

**Crucial integration decision:** Tasks should attach to the **same projects that already exist in
the Hub** (Blenz, Healthy Cart). A project's workspace gets a new **"Tasks"** document type (alongside
Review Board / Text Doc / Open Canvas), OR a dedicated global "Tasks" area with a team/project filter.
*Recommendation:* both — a global Tasks view (Today / Upcoming / per-team filters) AND a Tasks tab
inside each project. This is what makes the later meeting-analyzer magic work: a meeting tied to
"Blenz" drops tasks straight into Blenz's task list.

**Teams:** FSH = Design, Marketing, Tech (engineers/backend/print). Implement teams as **labels**
(`@design @marketing @tech @print @backend`) so a task can belong to more than one, AND as default
**filter views** (one saved filter per team). This matches the "slight intersection" you described —
labels overlap cleanly where sections/projects can't.

**v1 CORE checklist (what Cursor builds first):**
1. Data model: `hub_tasks`, `hub_sections`, `hub_labels`, `hub_task_labels`, `hub_filters` (+ reuse projects/members).
2. Projects → sections → tasks → sub-tasks (2 levels), drag to reorder + indent.
3. Task fields: name, description, due date, priority P1–P4, labels, assignee, completed.
4. Quick Add with natural-language parsing + live chip preview (`#` `@` `p1-4` `+` dates + recurring).
5. Views: Inbox, Today, Upcoming, per-project, per-label, saved filters. List + Board layouts.
6. Comments + @mention on tasks (reuse Hub inbox).
7. Preset FSH labels + preset team filters seeded on first run.
8. Mobile: floating Dynamic Add, swipe-complete, NL quick-add, bottom nav. Fully responsive.
9. Recurring tasks (common grammar). Time reminders [NICE if time allows].

**Deferred to when the analyzer is built:**
- Paste-multi-line-to-tasks (the analyzer will feed tasks programmatically anyway).
- Natural-language filter creation via Claude API (you'll have the key wired).
- Deadlines-vs-due-dates split, calendar layout, activity log.

---

## 11. Supabase schema sketch (new tables, `hub_` prefixed)

```
hub_sections    (id, project_id→hub_projects, name, sort_order, created_at)
hub_tasks       (id, project_id→hub_projects, section_id→hub_sections nullable,
                 parent_id→hub_tasks nullable, name, description, due_at nullable,
                 priority int 1-4 default 4, assignee_id→hub_profiles nullable,
                 recurring_rule text nullable, completed bool default false,
                 completed_at nullable, created_by→hub_profiles, sort_order, created_at)
hub_labels      (id, name, color, scope text 'workspace', created_at)   -- pre-seed team labels
hub_task_labels (id, task_id→hub_tasks, label_id→hub_labels)            -- many-to-many
hub_filters     (id, owner_id→hub_profiles nullable for shared, name, query text, color, is_favorite)
hub_task_comments (id, task_id→hub_tasks, author_id, body, mentions uuid[], created_at)
```
All RLS membership-gated, same pattern as the rest of the Hub. Reuses `hub_projects`,
`hub_profiles`, `hub_project_members`.
