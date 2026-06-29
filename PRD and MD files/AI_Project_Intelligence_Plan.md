# AI Project Intelligence — Planning & Feasibility Document

**Status:** Draft / brainstorming  
**App:** FSH Creative Hub (`fsh-creative-hub`)  
**Goal:** Fast, cheap, delightful “project brain” that summarizes collaterals across the full ecosystem — without feeling like a slow chatbot.

---

## 1. Vision in one sentence

A user opens a project (or asks from global search) and gets an **instant, structured briefing** — collaterals, workshop notes, review stats, open tasks, linked URLs — with **every item clickable** into the right canvas sticky, doc section, review asset, or task. It should feel like magic, but **90% of the work is pre-computed code**, not live LLM calls.

---

## 2. What we have today (baseline)

| Capability | Today | Gap |
|------------|-------|-----|
| **Search** | `hub-search.tsx` → `/api/search` → Postgres `ILIKE` on names + `plainTextPreview` | Finds items; does not *understand* or *summarize* |
| **Text docs** | `plainTextPreview` denormalized on save | Searchable; no block-level index or URL extraction |
| **Canvas** | `CanvasConfigV1` JSONB (`nodes[]`: sticky, image, section, embed, text) | Not indexed; sticky text invisible to search |
| **Review boards** | `hub_initiatives` → `hub_assets` with `status` (pending/approved/rejected/final) | Stats exist in DB; not surfaced as summaries |
| **Tasks** | `hub_tasks`, labels, sections | Searchable by name/description only |
| **Departments** | No schema — `hub_labels` are closest (design, marketing, etc.) | Must be inferred from labels or added later |
| **AI** | None | Greenfield |

**Key insight:** Most of the “intelligence” the user wants is **structured aggregation** (counts, lists, excerpts, links) — not generative prose. That is cheap to build in TypeScript + SQL and only needs Haiku for the final narrative polish.

---

## 3. Product surfaces (three presentation modes)

All three render the **same underlying `ProjectBrief` JSON** — only layout differs.

### A. Inline chart / side panel (default entry)

- Lives on **project home** (`project-home.tsx`) as a collapsible “Project brief” card.
- Also accessible from search when query looks like a summary intent (see §8).
- Shows: headline summary, collateral list, review stats chip row, top tasks, department/label tags.
- **Expand** button → overlay. **Open full page** link → dedicated route.

### B. Overlay modal

- `ProjectBriefOverlay` — large dialog, scrollable sections, sticky header with project name + last updated.
- Good for quick read without leaving project home.
- Mobile: becomes **bottom sheet** (full viewport height minus safe area).

### C. Full page

- Route: `/projects/[projectId]/brief` (or `/projects/[projectId]/intelligence`).
- Same content, room for timeline, filters, “ask a follow-up” input.
- Shareable URL within team (respects project membership RLS).

### Empty state

- Reuse the visual language of `hub-search-empty-state.tsx` (orbit illustration pattern).
- Copy: “No brief yet — run your first summary” + **3 template prompts** (see §4).
- First-run CTA triggers snapshot build (with progress animation).

### Template prompts (project-scoped examples)

| Prompt | What code gathers | When Haiku is used |
|--------|-------------------|-------------------|
| “What collaterals do we have?” | Asset list by initiative, file list by type, canvas image nodes | Optional 1-sentence intro |
| “Summarize review progress” | `COUNT(*) GROUP BY status`, recent comments | Optional narrative |
| “What’s blocking this project?” | Overdue tasks, rejected assets, stale items | Yes — synthesis |

Prompts are **buttons**, not freeform-only — reduces bad queries and token waste.

---

## 4. What to extract from each content type (deterministic)

### 4.1 Open Canvas (`hub_project_files.type = 'canvas'`)

Parse `config.nodes[]` in code (`src/lib/canvas/types.ts`):

| Node type | Extract | Deep link |
|-----------|---------|-----------|
| `sticky` | `text`, `color`, `authorName`, `sectionId` | `?node={id}` on canvas route |
| `section` | `title`, `subtitle`, child stickies via `sectionId` | `?node={id}` |
| `image` | `imageUrl`, dimensions; **no vision in v1** — use filename/URL heuristics | `?node={id}` |
| `embed` | `embedUrl`, `label` | `?node={id}` |
| `text` | text content | `?node={id}` |

**Workshop detection (no AI):** If canvas has `section.templateId === "how-might-we"` OR ≥3 stickies grouped under sections → tag as `workshop`.

**Image “gibberish names” (v1 heuristic, no vision):** Extract storage path basename; if short/random, label as “Image on canvas” + thumbnail. **V2 optional:** batch vision captions via Haiku only for images without alt text (expensive — cap at 10/project/day).

### 4.2 Review Board

From SQL (no AI):

```sql
-- Per initiative / board
SELECT status, COUNT(*) FROM hub_assets WHERE initiative_id = ? GROUP BY status;
```

Also extract:
- Initiative names (collateral groupings)
- Asset names, tags, status, `public_url`
- Recent `hub_comments` count (last 7 days)
- `hub_activity` feed highlights

**Output shape:**

```json
{
  "reviewStats": {
    "total": 42,
    "approved": 30,
    "rejected": 5,
    "pending": 7,
    "final": 0
  },
  "byInitiative": [{ "name": "Menu graphics", "approved": 12, "pending": 3 }]
}
```

### 4.3 Text Document

Parse `config.blocks[]` (`src/lib/documents/types.ts`):

| Block type | Extract |
|------------|---------|
| `paragraph`, `heading*` | Text excerpt (first 200 chars per block) |
| `code` | Language + first line |
| `embed` | URL |
| `page_link` | Linked doc ID → resolve name |
| Any block | Regex URLs: `https?://[^\s]+` |

Store **block index** for deep links: `textDocumentPath(projectId, docId) + ?block={blockId}`.

`plainTextPreview` already exists — reuse for full-text search in brief index.

### 4.4 Task List

From `hub_tasks` + `hub_task_labels` + `hub_labels`:

| Field | Use |
|-------|-----|
| `completed`, `due_at`, `priority` | “Blocking” / “Due this week” sections |
| `assignee_id` → profile | Who owns what |
| Labels | Proxy for “department” (design, marketing) |
| `description` | Excerpt |

Deep link: existing `taskDeepLinkPath(taskId, projectId)`.

---

## 5. Architecture: “Code-first, AI-last”

```
┌─────────────────────────────────────────────────────────────┐
│  USER QUERY / "Generate brief"                               │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. INTENT ROUTER (pure code, <5ms)                          │
│     - keyword rules: "collateral", "review", "blocking"      │
│     - or template prompt ID                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. RETRIEVE PRE-COMPUTED SNAPSHOT (Postgres, <50ms)         │
│     hub_project_briefs row OR cache miss → build on demand   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. FILTER / SLICE (code)                                    │
│     JSON path queries on snapshot.sections                   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. OPTIONAL: Haiku narrative layer (only if needed)       │
│     Input: compact JSON (~2–4k tokens max)                   │
│     Output: 3–5 sentences + reuse structured links           │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RENDER ProjectBrief UI (React)                           │
│     All entities carry { id, kind, href, label, meta }       │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** Never send raw canvas JSON or full doc blocks to the LLM. Send **pre-digested facts**.

---

## 6. Data model & indexing

### 6.1 New table: `hub_project_briefs`

| Column | Type | Purpose |
|--------|------|---------|
| `project_id` | UUID PK | One active brief per project |
| `snapshot` | JSONB | Full `ProjectBrief` structure |
| `snapshot_version` | int | Schema migrations |
| `content_hash` | text | Hash of source data — skip rebuild if unchanged |
| `built_at` | timestamptz | Last full build |
| `stale_after` | timestamptz | `built_at + interval` for background refresh |
| `build_duration_ms` | int | Observability |

### 6.2 New table: `hub_content_index` (searchable chunks)

Denormalized rows for **fast keyword retrieval** without parsing JSONB at query time.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | |
| `project_id` | UUID | RLS via membership |
| `source_kind` | enum | `canvas_sticky`, `canvas_image`, `doc_block`, `asset`, `task`, `comment` |
| `source_id` | text | Node ID, block ID, asset ID, etc. |
| `parent_file_id` | UUID nullable | Canvas/doc/board file |
| `title` | text | Display label |
| `body` | text | Searchable text (max ~2k chars) |
| `meta` | JSONB | `{ status, label, author, urls[] }` |
| `href` | text | Pre-built deep link |
| `tsv` | tsvector | Generated column for Postgres full-text search |

**Index:** GIN on `tsv`, btree on `(project_id, source_kind)`.

This replaces naive `ILIKE` for intelligence queries and scales better than scanning `config` JSONB.

### 6.3 `ProjectBrief` JSON schema (snapshot)

```typescript
type ProjectBrief = {
  version: 1;
  projectId: string;
  projectName: string;
  generatedAt: string;
  headline: string; // code-generated default; Haiku override optional
  sections: {
    collaterals: BriefItem[];
    workshops: BriefItem[];      // canvas groupings
    documents: BriefItem[];
    reviewSummary: ReviewSummary;
    tasks: { open: number; overdue: number; highlights: BriefItem[] };
    labels: string[];            // dept proxy
    urls: BriefItem[];           // extracted links
  };
  stats: {
    fileCount: number;
    assetCount: number;
    canvasNodeCount: number;
    openTaskCount: number;
  };
};

type BriefItem = {
  id: string;
  kind: "asset" | "file" | "canvas_node" | "doc_block" | "task" | "url";
  label: string;
  excerpt?: string;
  href: string;
  openInNewTab?: boolean;
  meta?: Record<string, string | number>;
};
```

Every `BriefItem` is a **clickable chip/card** in the UI.

---

## 7. Snapshot build pipeline (speed + cost)

### 7.1 When to rebuild

| Trigger | Action |
|---------|--------|
| **Nightly cron** (Vercel Cron / Supabase pg_cron) | Rebuild all active projects (not trashed) |
| **On content save** | Debounced incremental update (5 min coalesce per project) |
| **On user “Refresh brief”** | Force rebuild if `built_at > 5 min ago` |
| **On cache hit** | Return snapshot immediately — **target <100ms** |

### 7.2 Build steps (all code, no AI)

1. Fetch project metadata + files + initiatives + assets + tasks + labels (parallel Supabase queries — same pattern as `searchHub`).
2. For each canvas/doc file: parse config once, emit `hub_content_index` rows + `BriefItem`s.
3. Compute review aggregates in SQL.
4. Merge into `ProjectBrief`, compute `content_hash`.
5. If hash unchanged vs previous → skip write.
6. **Optional async job:** call Haiku once to rewrite `headline` + section intros → store in `snapshot.narrative`.

### 7.3 Content hash (skip redundant work)

Hash inputs:
- `hub_project_files.updated_at` max
- `hub_assets` count + max `updated_at`
- `hub_tasks` open count + max `updated_at`
- Per-file config length + hash of sticky texts

If hash matches → **zero rebuild cost**.

---

## 8. Query routing: search bar integration

Extend `hub-search.tsx` with a **second mode**:

| User input | Behavior |
|------------|----------|
| Short keyword (<20 chars, no `?`) | Existing `ILIKE` search (fast) |
| Starts with `?` or “summarize”, “what”, “show me” | Route to `/api/intelligence?q=...` |
| Empty + AI tab | Show template prompts + empty illustration |

`/api/intelligence` flow:
1. Detect project scope (from current route or project name match).
2. Load snapshot.
3. Code-filter sections by query keywords (BM25 / `tsv @@ plainto_tsquery`).
4. Only if user asks open-ended question AND filtered results < 3 → Haiku with compact context.

**50-person team:** Snapshots are **per project**, not per user. One build serves all members. Reads are cheap; RLS still applies on project access.

---

## 9. Loading UX (“AI is working” without lying)

Reuse patterns from `loading-affirmation.tsx` + search orbit animation.

### Progress stages (real steps, streamed via SSE or staged UI)

1. “Loading project snapshot…” (read DB)
2. “Reading {n} canvases…” (only on cache miss)
3. “Scanning {n} documents…”
4. “Checking review board stats…”
5. “Pulling open tasks…”
6. “Writing summary…” (only if Haiku called)

**Important:** Stages 2–5 are **instant** on cache hit (<100ms) — animation runs on a **minimum display timer** (400–600ms) so it doesn’t flash. On cache miss, stages reflect real progress.

### Reduced motion

Respect `useReducedMotion()` — static illustration, no staged delays.

---

## 10. AI cost model (Claude Haiku)

Assume **Claude 3.5 Haiku** (~$0.25 / 1M input tokens).

| Scenario | Tokens | Cost |
|----------|--------|------|
| Nightly headline for 20 projects | ~1.5k in + 200 out × 20 | ~$0.01/night |
| User asks custom question (cache hit) | 0 | $0 |
| User asks custom question (Haiku) | ~3k in + 400 out | ~$0.001/query |
| 50 users × 10 queries/day (worst case, all Haiku) | | ~$0.50/day |

**Cost controls:**
- Template prompts → mostly code-only
- Rate limit: 20 Haiku calls/user/day
- `content_hash` skip → no repeat builds
- Cap narrative length (max 500 tokens out)
- Never send images to vision in v1

---

## 11. Algorithms & data structures (practical, not over-engineered)

| Problem | Solution | Why |
|---------|----------|-----|
| Fast text search over chunks | Postgres `tsvector` + GIN | Already in stack; no Elasticsearch ops |
| Deduplication | `content_hash` (SHA-256 of canonical JSON) | O(1) skip |
| Top-k relevant chunks for query | `ts_rank` + `plainto_tsquery` | Built-in, good enough for v1 |
| Incremental index updates | Per-file delta: delete `hub_content_index WHERE parent_file_id = ?` then insert | Avoid full rebuild |
| Priority queue for nightly jobs | Simple `built_at ASC` batching | 50 projects × 2s build = 100s — fine |
| Deep link resolution | Pre-compute `href` at index time | O(1) at render |

**Skip for v1:** Vector embeddings, graph DBs, custom trie — unnecessary until >500 projects or semantic “find similar” is required.

**V2 optional:** `pgvector` on chunk embeddings for “find related collaterals” — still cheap with small index.

---

## 12. Mobile & tablet UX

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Side panel on project home + search overlay |
| **Tablet** | Bottom sheet overlay; 2-column brief cards |
| **Mobile** | FAB or project home banner “Brief”; full-screen sheet; **large tap targets** on every `BriefItem` |
| **Mobile search** | AI tab in search dropdown; template chips scroll horizontally |

**Mobile-first actions:**
- Swipe section cards
- “Open” vs “Open in new tab” on long-press (context menu)
- Copy link to any `BriefItem`

Use existing `hub-mobile-bottom-nav.tsx` patterns — don’t add a fifth nav item; keep intelligence inside project + search.

---

## 13. Departments (without new schema)

**V1 — label proxy:**
- Map `hub_labels.name` → department tags on brief
- Show: “Tagged: design (4 tasks), marketing (2 assets)”

**V2 — optional `hub_departments` table** if org grows past informal labels.

Do not block MVP on department schema.

---

## 14. Phased rollout (feasibility-ranked)

### Phase 1 — “Instant brief” (2–3 weeks, no AI)

- [ ] `hub_content_index` migration + indexer on canvas/doc save
- [ ] `hub_project_briefs` + nightly cron
- [ ] `ProjectBrief` builder (pure TypeScript)
- [ ] Inline card on project home
- [ ] Empty state + 3 template buttons (code-only answers)
- [ ] Clickable `BriefItem` links for all 4 ecosystems
- [ ] Loading stages (cache-hit timing)

**User value:** 80% of the vision. Zero API cost.

### Phase 2 — “Narrative polish” (1 week)

- [ ] Haiku integration (`/api/intelligence/narrate`)
- [ ] Overlay modal + full page route
- [ ] Search bar `?` / intent routing
- [ ] Rate limits + observability

### Phase 3 — “Smart queries” (2 weeks)

- [ ] Full-text search on `hub_content_index`
- [ ] Custom questions with retrieval + Haiku
- [ ] Incremental index on asset/task changes
- [ ] Review comment excerpts in brief

### Phase 4 — Nice-to-have

- [ ] Image captioning (Haiku vision, capped)
- [ ] Cross-project “portfolio brief” for admins
- [ ] pgvector semantic search
- [ ] Export brief as PDF/Markdown

---

## 15. What is NOT feasible / risks

| Item | Reality |
|------|---------|
| **Understand images by appearance in v1** | Needs vision API; expensive. Use thumbnails + filenames first. |
| **True real-time brief** | Debounce + nightly is enough; true realtime is overkill. |
| **Sub-second first-ever brief for huge projects** | 200+ canvas nodes may take 2–3s first build — show honest progress. |
| **Department intelligence without labels** | Must infer or add schema later. |
| **Replacing search entirely** | Keep both; search = lookup, intelligence = synthesis. |

---

## 16. API sketch

```
GET  /api/projects/[id]/brief          → cached ProjectBrief
POST /api/projects/[id]/brief/refresh  → trigger rebuild (auth + rate limit)
GET  /api/intelligence?q=&projectId=   → query snapshot (+ optional narrate)
POST /api/intelligence/ask             → { projectId, prompt } → SSE stream
```

Server Actions alternative: `getProjectBriefAction`, `refreshProjectBriefAction` — consistent with existing hub patterns.

---

## 17. Success metrics

| Metric | Target |
|--------|--------|
| Cached brief load | p95 < 150ms |
| Cold build (median project) | < 2s |
| Haiku calls per active user per day | < 5 median |
| Brief item click-through | measurable — validates usefulness |
| Mobile brief opens | >30% of desktop (indicates mobile UX works) |

---

## 18. Recommendation

**Build Phase 1 first.** It delivers the core vision — collateral lists, workshop stickies, review stats, task highlights, clickable deep links, fast empty-to-filled UX — with **zero ongoing AI cost**. Add Haiku only as a thin narrative layer once the structured snapshot is trustworthy.

The magic users feel should come from **how complete and clickable the brief is**, not from watching an LLM type paragraphs. Haiku makes it sound human; your indexer makes it instant.

---

## 19. Open questions for product

1. Should the brief be **auto-visible** on project home, or behind a “Generate brief” CTA?
2. Global intelligence across **all projects** for a user — in scope for v1 or v2?
3. Should canvas node deep links (`?node=`) pan/zoom the viewport? (Recommended: yes, small canvas UX addition.)
4. Who can trigger rebuild — all editors or admins only?

---

*Next step: review this doc, confirm Phase 1 scope, then implement `hub_content_index` migration + `ProjectBrief` builder.*
