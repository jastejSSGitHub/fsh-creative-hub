/**
 * Capture documentation screenshots. Requires dev server on :3010.
 * Usage: node scripts/capture-docs-screenshots.mjs
 *        node scripts/capture-docs-screenshots.mjs projects
 *        node scripts/capture-docs-screenshots.mjs projects project-home
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

loadEnv({ path: join(process.cwd(), ".env.local") });

const BASE = process.env.DOCS_SCREENSHOT_BASE ?? "http://localhost:3010";
const OUT = join(process.cwd(), "public", "docs", "screenshots");
const ONLY = process.argv.slice(2);
const DEV_BYPASS_EMAIL = "dev@fshdesign.local";
const PREFERRED_PROJECT_NAME = process.env.DOCS_SCREENSHOT_PROJECT_NAME ?? "Blenz";
const MOCK_COLLABORATION_COOKIE = "fsh-mock-collaboration";

const PAGES = [
  { path: "/", name: "landing", width: 1440, height: 900 },
  { path: "/login", name: "login", width: 1440, height: 900 },
  { path: "/docs", name: "docs-home", width: 1440, height: 900 },
];

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveDevScreenshotContext() {
  if (process.env.DOCS_SCREENSHOT_PROJECT_ID) {
    return {
      userId: process.env.DOCS_SCREENSHOT_USER_ID ?? null,
      projectId: process.env.DOCS_SCREENSHOT_PROJECT_ID,
    };
  }

  const admin = adminClient();
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const devUser = listed?.users.find(
    (user) => user.email?.toLowerCase() === DEV_BYPASS_EMAIL,
  );
  const userId = devUser?.id ?? null;

  const { data: projects } = await admin
    .from("hub_projects")
    .select("id, name, trashed_at")
    .is("trashed_at", null)
    .order("updated_at", { ascending: false });

  const preferred = projects?.find((project) => project.name === PREFERRED_PROJECT_NAME);
  const projectId = preferred?.id ?? projects?.[0]?.id ?? null;

  return { userId, projectId };
}

async function installOnboardingGuard(context, userId, projectId) {
  await context.addInitScript(
    ({ uid, pid, mockCookie }) => {
      try {
        localStorage.removeItem("fsh-dev-tools-simulate-new-user");
        localStorage.setItem("fsh-dev-tools-mock-collaboration", "1");
        document.cookie = `${mockCookie}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        if (uid) {
          localStorage.setItem(`fsh-hub-feature-onboarding-views:${uid}`, "3");
          for (const featureId of [
            "needs-you-feed",
            "for-you-triage",
            "for-you-inline-reply",
            "for-you-lenses",
            "global-quick-add",
            "smart-capture",
          ]) {
            localStorage.setItem(`fsh-colab-onboarding-${featureId}:${uid}`, "3");
          }
          if (pid) {
            localStorage.setItem(`fsh-project-onboarding:${uid}:${pid}`, "done");
            localStorage.removeItem(`fsh-project-onboarding:${uid}:${pid}:step`);
          }
        }
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith("fsh-colab-onboarding-")) {
            localStorage.setItem(key, "3");
          }
          if (key.startsWith("fsh-project-onboarding:")) {
            localStorage.setItem(key, "done");
          }
          if (key.startsWith("fsh-canvas-onboarding:")) {
            localStorage.setItem(key, "done");
          }
        }
      } catch {
        // ignore
      }
    },
    { uid: userId, pid: projectId, mockCookie: MOCK_COLLABORATION_COOKIE },
  );
}

async function installMockCollaborationCookie(context) {
  const baseUrl = new URL(BASE);
  await context.addCookies([
    {
      name: MOCK_COLLABORATION_COOKIE,
      value: "1",
      domain: baseUrl.hostname,
      path: "/",
    },
  ]);
}

/** Prevent hub / project / collaboration onboarding from appearing in screenshots. */
async function primeOnboardingStorage(page, userId, projectId) {
  await page.evaluate(
    ({ uid, pid }) => {
      try {
        localStorage.removeItem("fsh-dev-tools-simulate-new-user");
        if (uid) {
          localStorage.setItem(`fsh-hub-feature-onboarding-views:${uid}`, "3");
          if (pid) {
            localStorage.setItem(`fsh-project-onboarding:${uid}:${pid}`, "done");
            localStorage.removeItem(`fsh-project-onboarding:${uid}:${pid}:step`);
          }
        }
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith("fsh-hub-feature-onboarding-views:")) {
            localStorage.setItem(key, "3");
          }
          if (key.startsWith("fsh-colab-onboarding-")) {
            localStorage.setItem(key, "3");
          }
          if (key.startsWith("fsh-project-onboarding:")) {
            localStorage.setItem(key, "done");
          }
          if (key.startsWith("fsh-canvas-onboarding:")) {
            localStorage.setItem(key, "done");
          }
        }
      } catch {
        // ignore
      }
    },
    { uid: userId, pid: projectId },
  );
}

/** Dismiss any visible onboarding modals (hub tour, collaboration, project spotlight). */
async function dismissOnboarding(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let dismissed = false;

    const getStarted = page.getByRole("button", { name: "Get started" });
    if (await getStarted.isVisible().catch(() => false)) {
      await getStarted.click();
      dismissed = true;
    }

    const featureTour = page.getByRole("dialog", { name: "What's in Creative Hub" });
    if (await featureTour.isVisible().catch(() => false)) {
      const closeTour = featureTour.getByRole("button", { name: "Close" }).first();
      if (await closeTour.isVisible().catch(() => false)) {
        await closeTour.click();
        dismissed = true;
      }
    }

    const colabOnboarding = page.locator("#colab-onboarding-title");
    if (await colabOnboarding.isVisible().catch(() => false)) {
      const dontShowAgain = page.getByRole("button", { name: "Don't show again" });
      if (await dontShowAgain.isVisible().catch(() => false)) {
        await dontShowAgain.click();
        dismissed = true;
      } else {
        const colabCta = page
          .locator('[aria-labelledby="colab-onboarding-title"]')
          .getByRole("button")
          .last();
        if (await colabCta.isVisible().catch(() => false)) {
          await colabCta.click();
          dismissed = true;
        }
      }
    }

    const skipIntro = page.getByRole("button", { name: /skip intro/i });
    if (await skipIntro.isVisible().catch(() => false)) {
      await skipIntro.click();
      dismissed = true;
      const skipAnyway = page.getByRole("button", { name: /skip anyway/i });
      if (await skipAnyway.isVisible().catch(() => false)) {
        await skipAnyway.click();
        dismissed = true;
      }
    }

    const dialog = page.getByRole("dialog");
    if (await dialog.isVisible().catch(() => false)) {
      const action = page.getByRole("button", {
        name: /got it|skip anyway|skip|close|don't show again|next|dismiss/i,
      });
      if (await action.first().isVisible().catch(() => false)) {
        await action.first().click();
        dismissed = true;
      }
    }

    if (!dismissed) break;
    await page.waitForTimeout(300);
  }

  await page
    .waitForSelector('[aria-label="What\'s in Creative Hub"]', {
      state: "detached",
      timeout: 3000,
    })
    .catch(() => {});
  await page.getByText("Welcome to your project").waitFor({ state: "detached", timeout: 3000 }).catch(() => {});
  await page.locator("#colab-onboarding-title").waitFor({ state: "detached", timeout: 3000 }).catch(() => {});
  await page.getByRole("dialog").waitFor({ state: "detached", timeout: 2000 }).catch(() => {});
}

async function captureScreenshot(page, name) {
  await page.screenshot({
    path: join(OUT, `${name}.png`),
    fullPage: false,
  });
  console.log(`Captured ${name}.png`);
}

async function captureAuthenticated(page, path, name, userId, projectId) {
  await primeOnboardingStorage(page, userId, projectId);
  await page.goto(`${BASE}${path}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  if (page.url().includes("/login")) {
    throw new Error(`Lost auth session while capturing ${name} (${path}).`);
  }
  await page.waitForTimeout(2000);
  await primeOnboardingStorage(page, userId, projectId);
  await dismissOnboarding(page);
  await page.waitForTimeout(1000);
  await captureScreenshot(page, name);
}

async function dismissProjectOnboarding(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const welcomeVisible = await page
      .getByText("Welcome to your project")
      .isVisible()
      .catch(() => false);
    if (!welcomeVisible) break;

    const skipIntro = page.getByRole("button", { name: /skip intro/i });
    if (await skipIntro.isVisible().catch(() => false)) {
      await skipIntro.click();
      const skipAnyway = page.getByRole("button", { name: /skip anyway/i });
      await skipAnyway.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
      if (await skipAnyway.isVisible().catch(() => false)) {
        await skipAnyway.click();
      }
      await page.waitForTimeout(400);
      continue;
    }

    const closeButtons = page.getByRole("button", { name: "Close" });
    const count = await closeButtons.count();
    for (let i = 0; i < count; i += 1) {
      const close = closeButtons.nth(i);
      if (await close.isVisible().catch(() => false)) {
        await close.click();
        const skipAnyway = page.getByRole("button", { name: /skip anyway/i });
        if (await skipAnyway.isVisible().catch(() => false)) {
          await skipAnyway.click();
        }
        break;
      }
    }

    await page.waitForTimeout(300);
  }

  await page
    .getByText("Welcome to your project")
    .waitFor({ state: "detached", timeout: 5000 })
    .catch(() => {});
}

async function waitForForYouFeed(page) {
  await page
    .getByText("For You unavailable")
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => {});

  await page.getByRole("heading", { name: "Needs you", exact: true }).waitFor({
    state: "visible",
    timeout: 30000,
  });
}

async function captureForYou(page, userId, projectId) {
  await primeOnboardingStorage(page, userId, projectId);
  await page.goto(`${BASE}/for-you`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  if (page.url().includes("/login")) {
    throw new Error("Lost auth session while capturing for-you.");
  }

  await waitForForYouFeed(page).catch(async () => {
    await page.reload({ waitUntil: "networkidle", timeout: 60000 });
    await waitForForYouFeed(page);
  });

  await primeOnboardingStorage(page, userId, projectId);
  await dismissOnboarding(page);
  await page.locator("#colab-onboarding-title").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  await dismissOnboarding(page);
  await waitForForYouFeed(page);
  await page.waitForTimeout(800);
  await captureScreenshot(page, "for-you");
}

async function waitForTasksTodayView(page) {
  await page
    .getByText("Tasks unavailable")
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => {});

  await page.getByRole("heading", { name: "Today", exact: true }).waitFor({
    state: "visible",
    timeout: 30000,
  });
}

async function captureTasks(page, userId, projectId) {
  await primeOnboardingStorage(page, userId, projectId);
  await page.goto(`${BASE}/tasks/today`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  if (page.url().includes("/login")) {
    throw new Error("Lost auth session while capturing tasks.");
  }

  await page.waitForTimeout(1500);
  await dismissOnboarding(page);
  await waitForTasksTodayView(page).catch(async () => {
    await page.reload({ waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1500);
    await dismissOnboarding(page);
    await waitForTasksTodayView(page);
  });

  await primeOnboardingStorage(page, userId, projectId);
  await dismissOnboarding(page);
  await page
    .getByRole("dialog", { name: "What's in Creative Hub" })
    .waitFor({ state: "detached", timeout: 5000 })
    .catch(() => {});
  await page.locator("#colab-onboarding-title").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  await waitForTasksTodayView(page);
  await page.waitForTimeout(800);
  await captureScreenshot(page, "tasks");
}

async function captureProjectHome(page, projectId, userId) {
  await primeOnboardingStorage(page, userId, projectId);
  await page.goto(`${BASE}/projects/${projectId}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  if (page.url().includes("/login")) {
    throw new Error("Lost auth session while capturing project-home.");
  }
  await page.waitForTimeout(2500);
  await primeOnboardingStorage(page, userId, projectId);
  await dismissOnboarding(page);
  await dismissProjectOnboarding(page);

  if (await page.getByText("Welcome to your project").isVisible().catch(() => false)) {
    await primeOnboardingStorage(page, userId, projectId);
    await page.reload({ waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    await dismissOnboarding(page);
    await dismissProjectOnboarding(page);
  }

  await page.waitForTimeout(1000);
  await captureScreenshot(page, "project-home");
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const { userId, projectId } = await resolveDevScreenshotContext();
  if (!projectId) {
    throw new Error("No active project found for documentation screenshots.");
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await installOnboardingGuard(context, userId, projectId);
  await installMockCollaborationCookie(context);

  const wants = (name) => ONLY.length === 0 || ONLY.includes(name);

  if (ONLY.length === 0) {
    for (const pageDef of PAGES) {
      const tab = await context.newPage();
      const url = `${BASE}${pageDef.path}`;
      console.log(`Capturing ${url} → ${pageDef.name}.png`);
      try {
        await tab.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await tab.waitForTimeout(1500);
        await tab.screenshot({
          path: join(OUT, `${pageDef.name}.png`),
          fullPage: pageDef.path === "/",
        });
      } catch (err) {
        console.warn(`  Failed: ${err.message}`);
      }
      await tab.close();
    }
  }

  const authTab = await context.newPage();
  try {
    await authTab.goto(`${BASE}/auth/dev-bypass?next=/projects`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await authTab.waitForURL(/\/projects/, { timeout: 30000 });
    await authTab.waitForTimeout(1500);
    await primeOnboardingStorage(authTab, userId, projectId);
    await dismissOnboarding(authTab);

    const authPages = [{ path: "/projects", name: "projects" }].filter((p) => wants(p.name));

    for (const { path, name } of authPages) {
      await captureAuthenticated(authTab, path, name, userId, projectId);
    }

    if (wants("tasks")) {
      await captureTasks(authTab, userId, projectId);
    }

    if (wants("for-you")) {
      await captureForYou(authTab, userId, projectId);
    }

    if (wants("project-home")) {
      await captureProjectHome(authTab, projectId, userId);
    }
  } catch (err) {
    console.warn(`Auth screenshots skipped: ${err.message}`);
  }

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
