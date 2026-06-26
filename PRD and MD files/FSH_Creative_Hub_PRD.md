# FSH Creative Hub — Product Requirements Document

**Version:** 1.0
**Owner:** Jastej Singh (Product Designer, FSH Design)
**Status:** Ready to build
**Build target:** Single session — phased so every checkpoint is shippable

---

## 1. Summary

FSH Creative Hub is an internal, authenticated, mobile-responsive web app for the FSH marketing team and stakeholders to organize creative work by **project**, collaborate on **assets** (images, video) inside **initiatives**, and reach **consensus** through comments, reactions, and approve/reject voting.

It is "Figma for internal creative ops" — a visual, project-based collaboration surface that replaces scattered email/Slack review threads. It evolves the existing single-purpose Blenz Review Board into a scalable, multi-project platform.

**Primary users:** FSH marketing team (editors), founders/stakeholders like Sandeep and Preeti (reviewers/admins), and invited viewers.

**Core promise:** Open the hub → pick a project → enter an initiative → see all media as a beautiful grid → open any asset → comment, @mention, react, and vote → watch consensus form in real time.

---

## 2. Goals & Non-Goals

### Goals
- Replace email/Slack creative review with one visual, organized, persistent tool.
- Make team consensus *visible and meaningful* (not just a yes/no).
- Be genuinely pleasant on mobile, not a desktop tool that technically loads on a phone.
- Scale across many projects and initiatives without re-architecting.
- Require authentication; everyone has an identity and a role.

### Non-Goals (this version)
- Not a file-versioning system (no diffing asset revisions yet).
- Not a full DAM (digital asset manager) with rights/metadata management.
- Not a client-facing portal yet (presentation mode is internal-facing in v1).
- No external integrations (Slack/email notifications) in this version.

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Real auth, routing, API routes, Vercel-native. Moves off the single-HTML-file constraint because real auth/RLS needs it. |
| Styling | **Tailwind CSS** | Fast, responsive-first, consistent tokens. |
| UI primitives | **shadcn/ui** (Radix under the hood) | Accessible modals, dropdowns, tabs out of the box — saves hours. |
| Motion | **Framer Motion** | Landing-page scroll reveals + tasteful app micro-interactions. |
| Auth | **Supabase Auth** (email magic link + Google OAuth) | Same project, no extra service. Magic link = no password friction for a small team. |
| Database | **Supabase Postgres** | Already in use. |
| Storage | **Supabase Storage** (`hub-media` bucket) | New bucket, separate from `graphics` and fitpro's `progress-photos`. |
| Realtime | **Supabase Realtime** (Postgres changes) | Live comments, votes, presence. |
| Security | **Row-Level Security (RLS)** on every table | Non-negotiable once auth exists. |
| Deploy | **Vercel** + GitHub | Already planned. |

**Important decision (documented):** We are *replacing* the single-HTML-file architecture with Next.js. The original review board stays untouched as-is. The hub is a new app in `fsh-creative-hub/`. Reusing one Supabase project is fine — the new tables are namespaced and isolated from fitpro via RLS.

---

## 4. Information Architecture

```
Landing Page (public, unauthenticated) — "/"
└── CTA → Login → Hub

Hub (authenticated)
└── Projects (grid of project cards)
    └── Project Workspace
        ├── Initiatives (tabs or sub-grid — e.g. "Summer Campaign", "Menu Refresh")
        │   └── Assets (image/video grid with thumbnails + metadata)
        │       └── Asset Detail (full-screen overlay)
        │           ├── Threaded comments + @mentions
        │           ├── Reactions (🔥 👍 🤔 ❌)
        │           ├── Approve / Reject
        │           └── Consensus bar + Final Pick lock
        ├── Ideas Board (per initiative — sticky idea cards + upvotes)
        └── Activity Feed (per project)
```

---

## 5. Data Model (Supabase Postgres)

All tables prefixed `hub_` to isolate from fitpro tables.

### `hub_profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, = auth.users.id) | |
| email | text | |
| display_name | text | |
| avatar_url | text | nullable |
| created_at | timestamptz | default now() |

### `hub_projects`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| description | text | nullable |
| cover_url | text | nullable |
| created_by | uuid → hub_profiles | |
| created_at | timestamptz | |

### `hub_project_members`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid → hub_projects | |
| user_id | uuid → hub_profiles | |
| role | text | `admin` \| `editor` \| `viewer` |
| created_at | timestamptz | |

*Composite uniqueness on (project_id, user_id).*

### `hub_initiatives`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid → hub_projects | |
| name | text | |
| description | text | nullable |
| sort_order | int | default 0 |
| created_at | timestamptz | |

### `hub_assets`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| initiative_id | uuid → hub_initiatives | |
| name | text | display name |
| type | text | `image` \| `video` |
| storage_path | text | path in `hub-media` |
| public_url | text | |
| tag | text | auto/inferred or manual (e.g. "Marketing Poster") |
| status | text | `pending` \| `approved` \| `rejected` \| `final` |
| uploaded_by | uuid → hub_profiles | |
| sort_order | int | default 0 |
| created_at | timestamptz | |

### `hub_comments`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| asset_id | uuid → hub_assets | |
| parent_id | uuid → hub_comments | nullable (threading) |
| author_id | uuid → hub_profiles | |
| body | text | |
| mentions | uuid[] | array of mentioned user ids |
| resolved | bool | default false |
| created_at | timestamptz | |

### `hub_votes`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| asset_id | uuid → hub_assets | |
| user_id | uuid → hub_profiles | |
| reaction | text | `fire` \| `up` \| `hmm` \| `no` |
| created_at | timestamptz | |

*Unique on (asset_id, user_id) — one reaction per person per asset; re-voting overwrites.*

### `hub_ideas`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| initiative_id | uuid → hub_initiatives | |
| author_id | uuid → hub_profiles | |
| body | text | |
| color | text | sticky color token |
| created_at | timestamptz | |

### `hub_idea_votes`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| idea_id | uuid → hub_ideas | |
| user_id | uuid → hub_profiles | |

### `hub_activity`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid → hub_projects | |
| actor_id | uuid → hub_profiles | |
| verb | text | `approved` \| `rejected` \| `commented` \| `uploaded` \| `voted` \| `final` |
| target_type | text | `asset` \| `idea` \| `initiative` |
| target_id | uuid | |
| summary | text | precomputed display string |
| created_at | timestamptz | |

### RLS policy summary
- A user can read/write a project's data **only if** they have a row in `hub_project_members` for that project.
- `viewer` role: read everything in project + insert into `hub_comments` and `hub_votes` only.
- `editor` role: viewer + insert/update `hub_assets`, `hub_initiatives`, `hub_ideas`.
- `admin` role: editor + manage members, delete, set `final` status, edit project.
- fitpro tables are untouched and remain isolated (no policy grants them to hub users).

---

## 6. Feature Specification

### 6.1 Authentication & Roles
- Supabase Auth, magic-link email + Google OAuth.
- On first login, auto-create `hub_profiles` row.
- No unauthenticated access to any route except `/login`.
- Roles per project: admin / editor / viewer.
- **Viewers can comment and vote** (Figma model) but cannot upload or change status.

### 6.2 Project Grid (home)
- Responsive grid of project cards.
- Each card: cover image, project name, asset count, member avatar stack, last-activity timestamp.
- "+ New Project" (admin/editor) → modal (name, description, cover upload).
- Only shows projects the user is a member of.

### 6.3 Project Workspace
- Header: project name, member avatars, "Invite" button (admin), role badge.
- Initiatives as horizontal tabs (desktop) / dropdown selector (mobile).
- "+ New Initiative" (editor+).
- Sub-views within a project: **Assets** (default), **Ideas**, **Activity**.

### 6.4 Asset Grid
- Card grid mirroring the current review board: thumbnail, name, tag, status stripe, consensus mini-bar.
- Upload via drag-drop or button (editor+) → uploads to `hub-media/{project}/{initiative}/`, creates `hub_assets` row, infers `tag` from filename (reuse `fileToTag()` logic), generates thumbnail/poster for video.
- Filters: All / Pending / Approved / Rejected / Final.
- Video cards autoplay-loop muted (like current board).

### 6.5 Asset Detail Overlay
- Full-screen lightbox (evolve the existing `openLightbox()`).
- Large media view; on mobile, vertical scroll layout.
- Right/bottom panel:
  - **Approve / Reject** buttons (editor+); status reflected live.
  - **Reaction row**: 🔥 👍 🤔 ❌ — anyone (incl. viewer) taps one; tap again to clear.
  - **Consensus bar**: stacked proportional bar of all reactions + count.
  - **Final Pick** lock (admin) — sets status `final`, visually badges the asset, ends voting.
  - **Threaded comments**: composer with `@` autocomplete against project members; replies nest one level; resolve checkmark collapses a thread.
- Deep-linkable URL: `/p/{project}/i/{initiative}/a/{asset}`.

### 6.6 Comments & @mentions
- `@` triggers member autocomplete; selected users stored in `mentions[]`.
- Mentioned users see the item in their **@mention inbox**.
- Resolve / unresolve; resolved collapse but remain in history.
- Realtime: new comments appear without refresh.

### 6.7 Reactions, Voting & Consensus
- Reaction set: `fire` (the one), `up` (works), `hmm` (needs work), `no`.
- One reaction per user per asset; overwrite on change.
- Consensus bar everywhere the asset appears (grid mini + detail full).
- "🔥 Leaders" surfacing per initiative — assets ranked by fire-count.

### 6.8 Ideas Board (brainstorming)
- Per initiative. Column/grid of sticky idea cards (text, author, color).
- "+ Add idea" (editor+; viewers can upvote).
- Upvote toggle per idea; sort by votes.
- v1 = card list with upvotes. (Freeform draggable canvas = explicitly v2.)

### 6.9 Activity Feed
- Per project, reverse-chronological.
- Auto-written on approve/reject/comment/upload/vote/final via trigger or app-side insert.
- Avatar + summary string + relative time.

### 6.10 @mention Inbox
- Personal view ("For You") across all projects: comments that @mention me, unresolved threads on my uploads.
- Badge count in global nav.

### 6.11 Presentation Mode (internal v1)
- Per initiative: full-screen, chrome-free sequence of `approved` + `final` assets.
- Arrow-key / swipe navigation. Clean background. For team review meetings.

### 6.13 Landing Page (public front door)
The only unauthenticated route (`/`). Logged-out users land here; CTA routes to login → hub. Logged-in users can skip through (or get a "Open Hub" button instead of "Sign in").

**Design direction — bold on a monochrome base (deliberate choice):**
FSH's brand is strict black-and-white, color only from client work. The landing page honors this: the boldness comes from *scale, contrast, motion, and structure* — not from a rainbow palette. Real asset thumbnails from the hub are the only color on the page. This is braver *and* on-brand, and tells a better story to leadership than generic maximalism.

- Near-black + off-white, high contrast. Optional grain/noise texture.
- Oversized **Bricolage Grotesque** display type as the hero device.
- Single restrained accent only on the primary CTA.

**Sections:**
1. **Hero** — giant kinetic headline (e.g. "Where FSH creative gets decided."), one-line descriptor, primary CTA ("Enter the Hub"), small "Internal tool · FSH Design" tag. Animated background: grain + slow gradient *or* slowly floating real asset thumbnails.
2. **Problem strip** — one bold line: "Creative review shouldn't live in 40 Slack messages."
3. **Feature showcase** — 4–6 scroll-revealed sections, each = punchy phrase + product visual. **Illustrations and motion mockups are preferred** over live product screenshots (keeps the page evergreen and avoids exposing real client work). Topics: project grid, asset lightbox + consensus bar, @mention comments, ideas board, presentation mode.
4. **How it works** — 3 steps: Pick a project → Drop the work → Reach consensus.
5. **Internal proof** — member avatar stack, "Built by the FSH design team," optional live stat ("{n} assets reviewed").
6. **Closing CTA** — full-bleed, single button.

**Motion:** Framer Motion — scroll reveals, a marquee, hover micro-interactions, optional custom cursor. Restrained, intentional. **Must respect `prefers-reduced-motion`.**

**Mobile:** hero type scales down but stays bold; sections stack; motion lightens. Fully responsive.


### 6.14 Mobile Responsiveness
- Mobile-first. Project grid → single column. Initiative tabs → dropdown. Asset grid → 1–2 col. Lightbox → vertical scroll, sticky action bar at bottom. Touch targets ≥ 44px.

---

## 7. Design System

Carry FSH's sensibility but let project content bring color (same principle as FSH brand: neutral chrome, color from the work).

- **Chrome:** near-black / espresso surfaces, off-white content areas.
- **Accent (hub UI):** keep neutral/monochrome so asset thumbnails pop. A single restrained accent for interactive states.
- **Status colors:** approved `#22C55E`, rejected `#EF4444`, final `#FFC94B` (badge), pending neutral.
- **Reactions:** 🔥 warm, 👍 green, 🤔 amber, ❌ red.
- **Type:** Bricolage Grotesque (display), Geist (body), Geist Mono (meta) — consistent with the current board.
- Cards: generous radius, soft shadows, status top-stripe (carry over from current board).
- Empty states: intentional "Coming soon" / "Drop your first asset" art, never blank.

---

## 8. Build Phases (checkpoints — each is shippable)

**Phase 0 — Scaffold (foundation)**
Next.js + Tailwind + shadcn/ui + Supabase client. Env wired. Deploys to Vercel.

**Phase 1 — Auth + schema + RLS**
Supabase Auth (magic link + Google). All `hub_` tables + RLS policies. Login/logout. Profile auto-create. *Checkpoint: you can log in and nothing leaks across projects.*

**Phase 2 — Projects + membership**
Project grid, create project, invite members, roles. *Checkpoint: real multi-project structure exists.*

**Phase 3 — Initiatives + asset upload + grid**
Initiative tabs, upload to `hub-media`, asset grid with thumbnails + tags + filters. *Checkpoint: this already replaces the old board.*

**Phase 4 — Asset detail: approve/reject + reactions + consensus**
Lightbox, voting, consensus bar, Final Pick. *Checkpoint: full review workflow live.*

**Phase 5 — Comments + @mention + realtime**
Threaded comments, autocomplete, resolve, live updates. *Checkpoint: collaboration live.*

**Phase 6 — Ideas board + activity feed + @mention inbox**
Brainstorming, activity, For-You inbox.

**Phase 7 — Presentation mode + polish + mobile pass**
Full-screen review, empty states, mobile QA.

**Phase 8 — Landing page**
Public `/` route. Built last so feature sections can use polished **illustrations / motion mockups** (not live screenshots — see §6.13). Bold monochrome hero, scroll-reveal feature showcase, CTA → login → hub. Framer Motion with `prefers-reduced-motion` respected. *Checkpoint: a teammate who's never seen the tool understands it in 15 seconds and clicks through.*

---

## 9. Success Criteria
- A team member logs in, opens a project, reviews assets, and votes — with zero instruction.
- Consensus on any asset is readable in under 2 seconds.
- Works cleanly one-handed on a phone.
- A stakeholder (Sandeep) can open presentation mode and review final picks in a meeting.
- No data from one project is visible to a non-member.

---

## 10. Cursor Build Prompt

> Paste the block below into Cursor to begin. Build phase by phase; confirm each checkpoint before moving on.

```
You are building "FSH Creative Hub" — an internal, authenticated, mobile-responsive
creative collaboration tool for a design agency. Think "Figma for internal creative ops."
Build it in the existing folder: FSH Internal Tools/fsh-creative-hub/
(replace the placeholder index.html copy — we are moving to a real app).

TECH STACK (use exactly this):
- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage, Realtime) — dedicated project
  ref: rnyeonvbnrwephpviyzu, url: https://rnyeonvbnrwephpviyzu.supabase.co
- New storage bucket: hub-media (create it, public read)
- Deploy target: Vercel + GitHub
- All new tables are prefixed hub_ and MUST NOT touch existing fitpro tables.

IMPORTANT: Put the Supabase URL and anon key in .env.local (NEXT_PUBLIC_*),
add a service-role key in .env.local for server-side admin tasks only, and
provide a .env.example. Never hardcode keys in committed source.

DATA MODEL: Implement these tables with Row-Level Security on ALL of them:
hub_profiles, hub_projects, hub_project_members, hub_initiatives, hub_assets,
hub_comments, hub_votes, hub_ideas, hub_idea_votes, hub_activity.
(Full column specs are in PRD section 5. RLS rules in section 5 "RLS policy summary":
membership-gated reads/writes; viewer can comment+vote only; editor can manage
content; admin can manage members + set 'final' + delete. fitpro tables stay isolated.)
Generate the SQL migration file under supabase/migrations/ and the RLS policies.

BUILD IN PHASES. After each phase, stop and tell me it's ready to test:

PHASE 0: Scaffold Next.js + Tailwind + shadcn/ui + Supabase client. Confirm it runs
  on localhost and deploys to Vercel.
PHASE 1: Supabase Auth (magic-link email + Google OAuth). Create all hub_ tables +
  RLS. Auto-create hub_profiles on first login. Protect all routes except /login.
PHASE 2: Project grid home (cover, name, asset count, member avatars, last activity).
  Create project (modal). Invite members + assign roles (admin/editor/viewer).
  Only show projects the user belongs to.
PHASE 3: Project workspace with initiatives as tabs (desktop) / dropdown (mobile).
  Create initiative. Asset upload (drag-drop + button) to hub-media/{project}/{initiative}/,
  infer tag from filename, generate video poster. Asset grid: thumbnail, name, tag,
  status stripe, consensus mini-bar. Filters: All/Pending/Approved/Rejected/Final.
PHASE 4: Asset detail full-screen overlay (mobile = vertical scroll, sticky bottom
  action bar). Approve/Reject (editor+). Reaction row 🔥👍🤔❌ (anyone, tap to toggle).
  Consensus stacked bar + counts. Final Pick lock (admin) → status 'final', badge,
  freeze voting. Deep-linkable URL /p/{project}/i/{initiative}/a/{asset}.
PHASE 5: Threaded comments (one level of nesting) with @mention autocomplete against
  project members, mentions[] stored, resolve/unresolve. Supabase Realtime so comments
  and votes update live.
PHASE 6: Ideas board per initiative (sticky idea cards + upvote toggle, sort by votes;
  viewers can upvote). Per-project activity feed (approve/reject/comment/upload/vote/final).
  Personal "For You" @mention inbox with nav badge count.
PHASE 7: Presentation mode per initiative (full-screen, chrome-free sequence of
  approved + final assets, arrow/swipe nav). Intentional empty states. Full mobile QA pass.
PHASE 8: Public landing page at "/" (the ONLY unauthenticated route besides /login).
  Logged-out users land here; primary CTA "Enter the Hub" routes to login then hub;
  logged-in users see "Open Hub" instead. Design: BOLD but MONOCHROME — near-black +
  off-white, high contrast, oversized Bricolage Grotesque hero type, grain/noise texture,
  single restrained accent on the CTA only. Color comes ONLY from real asset thumbnails
  (FSH brand rule: chrome stays black/white, color from the work). Sections: (1) kinetic
  hero with headline + descriptor + CTA + "Internal tool · FSH Design" tag and an animated
  background (grain + slow gradient or floating real asset thumbnails); (2) bold problem
  line;   (3) 4-6 scroll-revealed feature sections each pairing a punchy phrase with an
  illustration or motion mockup (project grid, lightbox + consensus bar, @mention comments,
  ideas board, presentation mode) — not live product screenshots; (4) 3-step "how it works";
  (5) internal proof (member avatars,
  "Built by the FSH design team"); (6) full-bleed closing CTA. Use Framer Motion for
  scroll reveals, a marquee, and hover micro-interactions — restrained, not gimmicky.
  MUST respect prefers-reduced-motion. Fully mobile responsive (hero scales, sections
  stack, motion lightens).

DESIGN: Neutral/monochrome chrome (espresso + off-white) so colorful asset thumbnails
pop. Status colors: approved #22C55E, rejected #EF4444, final #FFC94B badge. Fonts:
Bricolage Grotesque (display), Geist (body), Geist Mono (meta). Cards with generous
radius, soft shadows, status top-stripe. Touch targets >= 44px. Mobile-first.

Start with PHASE 0 now. Show me the file structure you'll create before writing code.
```

---

## 11. Open Decisions (resolve before/while building)
1. **Auth method** — magic link is lowest-friction for a small team; Google OAuth if everyone's on Google Workspace. *(Recommend: enable both.)*
2. **Invite flow** — invite by email (creates pending membership) vs. add-existing-user-only. *(v1: invite by email; they get access on first login.)*
3. **Video posters** — auto-generate server-side vs. first-frame on client. *(v1: client first-frame is fine.)*
4. **Idea board** — confirmed list+upvote for v1, draggable canvas deferred to v2.
