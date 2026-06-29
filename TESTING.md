# FSH Creative Hub — Testing Guide

This document describes the automated testing setup for **FSH Creative Hub** (`fsh-creative-hub`). Use it to run tests locally (e.g. weekly before a release) and to understand what each layer covers.

All commands assume you are in the project folder:

```bash
cd "FSH Internal Tools/fsh-creative-hub"
```

---

## Test run log

Record of completed test work and verification runs. Add a new entry at the top when you run a full session.

### 2026-06-29 — Full suite verification & testing infrastructure

**Nature of work**

| Area | What was done |
|------|----------------|
| **Tier 1 — Smoke E2E** | Playwright smoke tests for landing (4) and hub (6); E2E sign-in API; CI on every PR |
| **Tier 2 — Component** | Vitest + React Testing Library for modals, overlays, dialogs (6 files, 20 tests) |
| **Tier 1 — Full E2E** | Multi-user collaboration loop (`collaboration-loop.spec.ts`); CI on push to main |
| **Infrastructure** | `playwright.config.ts` aligned to port 3010; onboarding auto-skip in E2E auth; `E2E_TEST_SECRET` in `.env.local` |
| **Documentation** | This guide (`TESTING.md`) — commands, troubleshooting, weekly routine, Tier 3 roadmap |
| **Bug fixes during run** | Feature/collaboration onboarding blocking clicks; promote-task flow; comment → create task menu; complete/resolve selectors |

**Tests run today (all succeeded)**

| Type | Command / tag | Tool | Result | Notes |
|------|---------------|------|--------|-------|
| Component | `npm run test:unit` | Vitest + RTL | **20/20 passed** | ~2–3 sec; no server required |
| Build / types | `npm run validate` | tsc + motion check + `next build` | **Passed** | ~1–2 min |
| Smoke E2E | `npm run test:smoke` (`@smoke`) | Playwright | **10/10 passed** | Landing 4 + hub 6; ~1 min |
| Full E2E | `npm run test:e2e` (`@e2e`) | Playwright | **1/1 passed** | Collaboration loop; ~48–55 sec |

**Smoke E2E breakdown (10 tests)**

- `e2e/landing.smoke.spec.ts` — hero/nav/CTA, features scroll, docs link, mobile menu
- `e2e/hub.smoke.spec.ts` — sign-in, project home, asset overlay, inbox task quick-add, share dialog, delete confirm cancel

**Component test breakdown (20 tests)**

- `hub-confirm-dialog`, `asset-delete-confirm-dialog`, `hub-dialog`, `invite-members-dialog`, `task-detail-overlay`, `asset-detail-overlay`

**Full E2E breakdown (1 test)**

- `e2e/collaboration-loop.spec.ts` — personal task → promote → comment (User B) → task from comment → complete → resolve thread → For You cleared

**Scheduled for next test session**

| When | What to run |
|------|-------------|
| **Weekly** (or before deploy) | `test:unit` → `validate` → `test:smoke` |
| **After collaboration / tasks / For You changes** | Also `test:e2e` |
| **Not yet built (Tier 3)** | Unit tests for `lib/` parsers; visual regression on landing; expanded smoke for new flows; axe a11y |

*Next suggested full run: one week from this date, or before the next production deploy.*

---

## Testing pyramid (what we built)

```
        ▲  E2E full flow — collaboration loop (@e2e, on main push)
       ▲▲  E2E smoke — browser critical paths (@smoke, every PR)
      ▲▲▲  Component tests — modals/dialogs/overlays (Vitest, every PR)
     ▲▲▲▲  Always-on — typecheck + build (every PR)
```

| Tier | Name | Tool | Speed | What it catches |
|------|------|------|-------|-----------------|
| **1** | Smoke E2E | Playwright | ~1 min | Broken login, project home, asset overlay, tasks, share/delete dialogs, landing page |
| **2** | Component | Vitest + React Testing Library | ~2 sec | Modal won’t open, wrong buttons, cancel/confirm logic, invite validation |
| **Build** | Validate | TypeScript + Next build | ~1–2 min | Compile errors, broken imports, type mistakes |

**Tier 1** and **Tier 2** are implemented and passing locally. CI runs them on every pull request (see [CI](#ci-automation) below).

### Current coverage (expected green)

| Command | Expected result | Typical time |
|---------|-----------------|--------------|
| `npm run test:unit` | **20/20** tests pass | ~2–3 sec |
| `npm run validate` | typecheck + motion keyframes + build pass | ~1–2 min |
| `npm run test:smoke` | **10/10** tests pass (`@smoke`) | ~1 min |
| `npm run test:e2e` | **1/1** test passes (`@e2e`) | ~1 min |

---

## Prerequisites (local E2E only)

Component tests (`test:unit`) and `npm run validate` need **no** running server and **no** Supabase.

Browser tests (`test:smoke`, `test:e2e`) need:

### 1. Environment variables (`.env.local`)

Copy from `.env.example` and fill in real values:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API (fixtures, task cleanup) |
| `E2E_TEST_SECRET` | Unlocks `/api/e2e/sign-in` locally and in CI |
| `E2E_TEST_PASSWORD` | Password for E2E test users |

Local defaults from `.env.example` (fine for dev):

```
E2E_TEST_SECRET=local-e2e-secret
E2E_TEST_PASSWORD=e2e-test-password-local
```

**Important:** If E2E sign-in fails with “disabled”, add `E2E_TEST_SECRET` to `.env.local` and **restart** the dev server (`npm run dev`). Next.js only reads env vars at startup.

`E2E_TEST_SECRET` must **never** be set on Vercel production.

### 2. Dev server and port 3010

Playwright and `npm run dev` both use port **3010**.

Next.js allows only **one** dev server per project directory (regardless of port). Choose one approach:

| Approach | When to use |
|----------|-------------|
| **A — Let Playwright start the server** | Simplest for weekly checks. Run `npm run test:smoke` or `npm run test:e2e` alone. |
| **B — Keep the app open while testing** | Run `npm run dev` in terminal 1, then `npm run test:smoke` in terminal 2. Playwright reuses the running server. |

If you see **“Another next dev server is already running”**, stop the existing server (close the terminal or kill the PID shown in the error), then rerun tests.

Playwright starts the server with `npx next dev -p 3010` and injects E2E env vars automatically when it starts the server itself.

### 3. Playwright browsers (first time only)

```bash
npx playwright install chromium
```

### 4. What E2E tests do automatically (onboarding)

Product onboarding modals can block clicks in the real app. E2E helpers handle this so tests stay stable:

- **Feature tour** (“What’s in Creative Hub”) — skipped via `localStorage` at sign-in
- **Collaboration tooltips** (task visibility, promote, comment-to-task, etc.) — skipped the same way
- **Fallback** — `dismissOnboardingIfPresent()` clicks “Get started”, “Don’t show again”, or Close if anything still appears

You do not need to dismiss these manually when running tests.

Implementation: `e2e/helpers/auth.ts`, `e2e/global-setup.ts`, `src/app/api/e2e/sign-in/route.ts` (returns `userId` for onboarding skip).

---

## Commands cheat sheet

### Quick weekly check (recommended)

Run this before calling a release “good”. All commands from the project folder:

```bash
cd "FSH Internal Tools/fsh-creative-hub"
npm run test:unit
npm run validate
npm run test:smoke
```

`test:smoke` starts the dev server on port 3010 automatically if one is not already running.

**If you changed tasks, comments, For You, or collaboration flows that week**, also run:

```bash
npm run test:e2e
```

**Run everything in one go (optional):**

```bash
npm run test:unit && npm run validate && npm run test:smoke && npm run test:e2e
```

### Tier 2 — Component tests (Vitest)

| Command | What it does |
|---------|----------------|
| `npm run test:unit` | Run all 20 component tests once |
| `npm run test:unit:watch` | Re-run tests on file save (while developing) |

**No browser, no Supabase.** Safe to run anytime.

### Tier 1 — Browser tests (Playwright)

| Command | What it does |
|---------|----------------|
| `npm run test:smoke` | 10 smoke tests (`@smoke`) — landing + hub critical paths |
| `npm run test:e2e` | Full collaboration loop (`@e2e`) — multi-user task → comment → complete |
| `npm run test:all` | Every Playwright test (smoke + e2e) |
| `npm test` | Same as `test:all` |

Run a single file:

```bash
npm run test:smoke -- e2e/landing.smoke.spec.ts
npm run test:smoke -- e2e/hub.smoke.spec.ts
npm run test:e2e -- e2e/collaboration-loop.spec.ts
```

Debug a failing E2E test (opens browser UI):

```bash
npx playwright test --ui
```

View last failure trace:

```bash
npx playwright show-trace test-results/<folder>/trace.zip
```

### Build / types (no browser)

| Command | What it does |
|---------|----------------|
| `npm run typecheck` | TypeScript only |
| `npm run validate` | Typecheck + motion keyframes check + production build |
| `npm run lint` | ESLint |

---

## What each test suite covers

### Tier 2 — Component tests (`src/**/*.test.tsx`)

| File | Covers |
|------|--------|
| `hub-confirm-dialog.test.tsx` | Confirm/cancel dialogs |
| `asset-delete-confirm-dialog.test.tsx` | Delete asset confirmation |
| `hub-dialog.test.tsx` | Base modal shell (title, close) |
| `invite-members-dialog.test.tsx` | Members list, close, email validation |
| `task-detail-overlay.test.tsx` | Task overlay open/close, move-to-project UI |
| `asset-detail-overlay.test.tsx` | Asset overlay header, close, Escape, share dialog |

Shared test helpers: `src/test/setup.ts`, `src/test/fixtures.ts`

### Tier 1 — Smoke E2E (`e2e/*.smoke.spec.ts`)

**Landing (4 tests)** — `e2e/landing.smoke.spec.ts`

- Hero, nav, CTA load
- Features anchor scroll
- Docs page
- Mobile menu open/close

**Hub (6 tests)** — `e2e/hub.smoke.spec.ts`

- Sign-in → projects
- Project home shows files
- Asset overlay open/close
- Task quick-add in inbox
- Share dialog from asset
- Delete confirm → cancel keeps asset

### Tier 1 — Full E2E (`e2e/collaboration-loop.spec.ts`)

**Collaboration loop (`@e2e`)** — two browser contexts (User A + User B), ~1 minute:

| Step | What happens |
|------|----------------|
| 1 | User A creates a personal task in inbox |
| 2 | User A promotes it to the E2E project (select project → Move → Move to project) |
| 3 | Asset linked via test fixture helper |
| 4 | User B opens the asset and posts a comment |
| 5 | User A creates a task from the comment (Comment options → Create task) |
| 6 | User A completes the follow-up task |
| 7 | User A resolves the feedback thread (prompt after complete) |
| 8 | For You **Needs you** lens no longer shows the follow-up item |

Runs on **push to main/master** in CI (not on every PR). Requires Supabase (same `.env.local` as smoke).

Test data: E2E users `e2e-user-a@fshdesign.local` / `e2e-user-b@fshdesign.local`, project **E2E Collaboration Loop**. `beforeAll` cleans up prior E2E tasks and comments.

---

## Weekly manual test routine

Suggested cadence: **once a week** or **before any production deploy**.

### Step 1 — Automated (copy/paste)

Expect: **20/20** unit, validate green, **10/10** smoke. Add **1/1** e2e when collaboration changed.

```bash
cd "FSH Internal Tools/fsh-creative-hub"
npm run test:unit
npm run validate
npm run test:smoke
```

`test:smoke` starts the dev server on port 3010 automatically if one is not already running. If you prefer to keep the app open while testing, run `npm run dev` first in another terminal — Playwright will reuse it.

If you shipped task/collaboration changes that week:

```bash
npm run test:e2e
```

All at once (optional): `npm run test:unit && npm run validate && npm run test:smoke && npm run test:e2e`

### Step 2 — Quick human pass (5–10 min)

Automation cannot replace eyes on new UI. Spot-check:

- [ ] Landing page looks correct on desktop and phone
- [ ] Login → projects loads
- [ ] Open a project → open a review board → open/close an asset
- [ ] Add a personal task in inbox
- [ ] Share dialog opens and closes
- [ ] One flow you changed most recently

### Step 3 — If something failed

1. Read the terminal error (component tests name the file; Playwright saves screenshots in `test-results/`)
2. See [Troubleshooting](#troubleshooting) below for common local issues
3. Fix the bug
4. Add or update a test so it does not come back:
   - **Modal/button bug** → component test (`src/**/*.test.tsx`)
   - **Critical path bug** → smoke test (`e2e/*.smoke.spec.ts`)
   - **Multi-user / collaboration bug** → `e2e/collaboration-loop.spec.ts`

---

## Troubleshooting (local runs)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `E2E sign-in is disabled` | `E2E_TEST_SECRET` missing or dev server started before it was added | Add to `.env.local`, restart `npm run dev`, or let Playwright start a fresh server |
| `Another next dev server is already running` | Two `next dev` processes for this project | Kill the PID from the error message, or close the extra terminal |
| `net::ERR_CONNECTION_REFUSED` on port 3011 | Stale config or wrong port | Use port **3010** only; run `npm run test:smoke` without `CI=true` locally |
| Click times out; overlay blocking | Onboarding modal | Should be auto-dismissed; if not, check `e2e/helpers/auth.ts` and that sign-in returns `userId` |
| One smoke test fails mid-suite; server errors in log | Next.js hot reload during long E2E run | Rerun `npm run test:smoke` — usually passes on second run. CI uses a clean server (more stable) |
| Collaboration test: task not found after create | DB write lag | Test polls for task ID; if flaky, rerun `npm run test:e2e` |
| `Failed to fetch` on sign-in | Server not ready or crashed | Stop all dev servers, rerun tests so Playwright starts fresh |

**Debug interactively:**

```bash
npx playwright test --ui
npx playwright test e2e/hub.smoke.spec.ts --debug
```

**Artifacts on failure:** `test-results/<test-name>/` (screenshot, `error-context.md`, trace on retry in CI).

---

## CI automation

On every **pull request**:

1. `typecheck`
2. `test:unit` (Tier 2)
3. `build`
4. `test:smoke` (Tier 1) — requires GitHub secrets for Supabase + E2E

On **push to main/master** (after smoke passes):

5. `test:e2e` — collaboration loop

Required GitHub repository secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_SECRET`, `E2E_TEST_PASSWORD`.

---

## Growing the suite

When you fix a regression:

1. Reproduce it manually once
2. Add the smallest test that would have caught it
3. Do not try to test “every click” — cover **critical paths** and **bugs you’ve already hit**

Tag convention:

- `@smoke` — fast critical paths (PR gate)
- `@e2e` — slower multi-step flows (main branch)

---

## Related files

| Path | Purpose |
|------|---------|
| `vitest.config.ts` | Component test runner |
| `playwright.config.ts` | Browser tests; port 3010; auto-starts dev server |
| `e2e/helpers/auth.ts` | Sign-in, onboarding skip, dismiss helpers |
| `e2e/helpers/fixture.ts` | Supabase fixtures, E2E users, task cleanup |
| `e2e/helpers/navigation.ts` | Board URLs, open asset helper |
| `e2e/global-setup.ts` | Preflight: E2E sign-in reachable on port 3010 |
| `src/app/api/e2e/sign-in/route.ts` | Dev-only Playwright sign-in API |
| `.github/workflows/ci.yml` | CI pipeline |
| `.env.example` | Required env vars for local E2E |

---

## What is done vs what remains

### Done (Tiers 1 & 2 + CI)

- [x] **20 component tests** — modals, overlays, dialogs, invite validation
- [x] **10 smoke E2E tests** — landing + hub critical paths (`@smoke`)
- [x] **1 full collaboration E2E** — multi-user task → comment → complete → resolve (`@e2e`)
- [x] **`npm run validate`** — typecheck, motion keyframes, production build
- [x] **CI on every PR** — validate + unit + smoke
- [x] **CI on main push** — full collaboration E2E
- [x] **E2E infrastructure** — sign-in API, fixtures, onboarding skip, port 3010 alignment

### Not built yet (Tier 3+)

See [Tier 3 — What’s next](#tier-3--whats-next-not-built-yet) below. Summary:

| Item | Status |
|------|--------|
| Unit tests for pure logic (`lib/` parsers, permissions, mentions) | Not started |
| Visual regression (landing/docs screenshots) | Not started |
| Expanded smoke E2E for new flows (canvas, docs, invite, share link) | Not started |
| Formal manual release checklist (beyond Step 2 above) | Partially documented |
| Accessibility audits (axe in Playwright) | Not started |
| Performance / load testing | Not started |

**You are not missing any required testing for the current Tier 1 & 2 setup.** Tier 3 is optional hardening as the product grows.

---

## Tier 3 — What’s next (not built yet)

Tiers 1 and 2 are **complete and documented above**. The next layer adds confidence in logic, layout, and release discipline without duplicating E2E.

### 3a. Unit tests for pure logic (high value, fast)

Test **functions with no UI** — cheap to run, easy to maintain:

- `lib/tasks/quick-add/parse-quick-add` — natural-language task parsing
- `lib/email` — invite validation (partially covered via invite dialog component test)
- `lib/permissions` — who can delete/edit what
- `lib/mentions/utils` — @mention parsing
- URL builders and route helpers

**Tool:** Vitest (same as Tier 2). **Effort:** small files next to `src/lib/**`.

### 3b. Visual regression (landing & marketing)

Catch “it works but looks wrong” — layout shifts, broken spacing, wrong colors:

- Playwright screenshot compare on `/` and key landing sections
- Or [Chromatic](https://www.chromatic.com/) if you want a hosted diff UI

**Best for:** landing page, docs home, any design-heavy static pages.

### 3c. Expanded E2E smoke (as you ship features)

Add 1–2 smoke tests per **new critical flow** (not every button):

- Canvas open/close
- Text document create
- Project invite → member appears
- Share link public page

Keep the smoke suite under ~15 minutes total.

### 3d. Manual release checklist (living doc)

A short checklist in this file or Notion for things automation misses:

- New feature you added this week
- Mobile Safari / Chrome spot-check
- Staging vs production env vars
- “Does it feel right” pass on brand/layout

### Suggested Tier 3 order

1. **Weekly routine** — use this doc’s [weekly routine](#weekly-manual-test-routine) consistently
2. **Unit tests for parsers/permissions** — biggest logic risk, fastest to add
3. **Visual regression on landing** — protects the public face of the product
4. **Grow smoke E2E** — one test per recurring bug or new core flow

Tier 4 (optional, later): performance budgets, accessibility audits (axe in Playwright), load testing on Supabase-heavy paths.
