import type { Page } from "@playwright/test";

import { E2E_PASSWORD, E2E_USER_A_EMAIL, E2E_USER_B_EMAIL } from "./fixture";

const E2E_SECRET = process.env.E2E_TEST_SECRET ?? "local-e2e-secret";

const COLLABORATION_ONBOARDING_FEATURES = [
  "needs-you-feed",
  "global-quick-add",
  "task-deep-link",
  "task-visibility",
  "promote-task",
  "task-asset-link",
  "comment-to-task",
  "for-you-inline-reply",
  "for-you-lenses",
  "task-watch",
  "thread-resolve-loop",
  "presence",
  "smart-capture",
  "for-you-triage",
  "split-pane-task-asset",
  "creative-board",
] as const;

async function skipProductOnboarding(page: Page, userId: string) {
  await page.evaluate(
    ({ id, features }) => {
      localStorage.setItem(`fsh-hub-feature-onboarding-views:${id}`, "3");
      for (const featureId of features) {
        localStorage.setItem(`fsh-colab-onboarding-${featureId}:${id}`, "2");
      }
    },
    { id: userId, features: [...COLLABORATION_ONBOARDING_FEATURES] },
  );
}

export async function signIn(page: Page, email: string) {
  await page.goto("/login");

  const result = await page.evaluate(
    async ({ signInEmail, password, secret }) => {
      const response = await fetch("/api/e2e/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-e2e-secret": secret,
        },
        body: JSON.stringify({ email: signInEmail, password }),
        credentials: "include",
      });

      if (!response.ok) {
        return { ok: false as const, error: await response.text() };
      }

      const body = (await response.json()) as { userId?: string };
      return { ok: true as const, userId: body.userId };
    },
    { signInEmail: email, password: E2E_PASSWORD, secret: E2E_SECRET },
  );

  if (!result.ok) {
    throw new Error(`E2E sign-in failed for ${email}: ${result.error}`);
  }

  if (result.userId) {
    await skipProductOnboarding(page, result.userId);
  }

  await page.goto("/projects");
  await page.waitForURL("**/projects**", { timeout: 30_000 });
}

export async function signInUserA(page: Page) {
  await signIn(page, E2E_USER_A_EMAIL);
}

export async function signInUserB(page: Page) {
  await signIn(page, E2E_USER_B_EMAIL);
}

export async function dismissOnboardingIfPresent(page: Page) {
  const featureTour = page.getByRole("dialog", { name: "What's in Creative Hub" });

  for (let attempt = 0; attempt < 6; attempt += 1) {
    let dismissed = false;

    if (await featureTour.isVisible().catch(() => false)) {
      const getStartedInTour = featureTour.getByRole("button", { name: "Get started" });
      if (await getStartedInTour.isVisible().catch(() => false)) {
        await getStartedInTour.click();
        dismissed = true;
      } else {
        const closeTour = featureTour.getByRole("button", { name: "Close" }).first();
        if (await closeTour.isVisible().catch(() => false)) {
          await closeTour.click();
          dismissed = true;
        } else {
          await page.keyboard.press("Escape");
          dismissed = true;
        }
      }
    }

    const getStarted = page.getByRole("button", { name: "Get started" });
    if (!dismissed && (await getStarted.isVisible().catch(() => false))) {
      await getStarted.click();
      dismissed = true;
    }

    const dontShowAgain = page.getByRole("button", { name: "Don't show again" });
    if (!dismissed && (await dontShowAgain.isVisible().catch(() => false))) {
      await dontShowAgain.click();
      dismissed = true;
    }

    const dialog = page.getByRole("dialog");
    if (await dialog.isVisible().catch(() => false)) {
      const action = page.getByRole("button", {
        name: /got it|skip|close|don't show again|next/i,
      });
      if (await action.first().isVisible().catch(() => false)) {
        await action.first().click();
        dismissed = true;
      }
    }

    if (!dismissed) break;
    await page.waitForTimeout(250);
  }
}
