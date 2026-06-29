import { expect, test } from "@playwright/test";

import { dismissOnboardingIfPresent, signInUserA, signInUserB } from "./helpers/auth";
import {
  cleanupE2EComments,
  cleanupE2ETasks,
  ensureCollaborationFixture,
  getTaskIdByName,
  getTaskProjectId,
  linkTaskToAsset,
} from "./helpers/fixture";

const PERSONAL_TASK_NAME = "E2E collab personal task";
const COMMENT_TEXT = "E2E feedback — please follow up";

test.describe("Collaboration loop @e2e", () => {
  let fixture: Awaited<ReturnType<typeof ensureCollaborationFixture>>;

  test.beforeAll(async () => {
    fixture = await ensureCollaborationFixture();
    await cleanupE2ETasks("E2E collab");
    await cleanupE2ETasks("E2E feedback");
    await cleanupE2EComments(fixture.assetId);
  });

  test("personal task → promote → link asset → comment → task from comment → complete → resolve", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();
    const pageA = await userAContext.newPage();
    const pageB = await userBContext.newPage();

    await signInUserA(pageA);
    await dismissOnboardingIfPresent(pageA);

    // 1. User A creates personal task in inbox
    await pageA.goto("/tasks/inbox");
    await dismissOnboardingIfPresent(pageA);
    const quickAdd = pageA.getByPlaceholder(/add a task|what needs doing/i).first();
    await quickAdd.fill(PERSONAL_TASK_NAME);
    await quickAdd.press("Enter");
    await expect(pageA.getByText(PERSONAL_TASK_NAME)).toBeVisible({ timeout: 15_000 });

    let personalTaskId: string | undefined;
    await expect
      .poll(async () => {
        personalTaskId = await getTaskIdByName(PERSONAL_TASK_NAME, fixture.userAId);
        return personalTaskId;
      }, { timeout: 15_000 })
      .toBeTruthy();

    // 2. Promote to project
    await pageA.goto(`/tasks/inbox?task=${personalTaskId}`);
    await dismissOnboardingIfPresent(pageA);
    await expect(pageA.getByRole("heading", { name: "Task details" })).toBeVisible({
      timeout: 10_000,
    });

    await pageA.getByRole("button", { name: /select project/i }).click();
    await pageA.getByRole("option", { name: fixture.projectName }).click();
    await expect(pageA.getByRole("button", { name: fixture.projectName })).toBeVisible();

    await pageA.getByRole("button", { name: "Move", exact: true }).click();
    await pageA.getByRole("button", { name: "Move to project" }).click();

    await expect
      .poll(async () => getTaskProjectId(personalTaskId!), { timeout: 15_000 })
      .toBe(fixture.projectId);

    await pageA.goto(`/projects/${fixture.projectId}/tasks`);
    await dismissOnboardingIfPresent(pageA);
    await expect(pageA.getByText(PERSONAL_TASK_NAME)).toBeVisible({ timeout: 15_000 });

    const taskId = personalTaskId;

    // 3. Link asset (service helper — no dedicated link UI on promoted task)
    await linkTaskToAsset(taskId!, fixture.assetId, fixture.userAId);

    // 4. User B comments on asset
    await signInUserB(pageB);
    await dismissOnboardingIfPresent(pageB);
    await pageB.goto(
      `/projects/${fixture.projectId}/boards/${fixture.boardId}?initiative=${fixture.initiativeId}&asset=${fixture.assetId}`,
    );
    await expect(pageB.getByRole("heading", { name: fixture.assetName })).toBeVisible({
      timeout: 20_000,
    });
    const composer = pageB.getByPlaceholder(/share feedback|comment/i).first();
    await composer.fill(COMMENT_TEXT);
    await pageB.getByRole("button", { name: /post|send|comment/i }).first().click();
    await expect(pageB.locator("p").filter({ hasText: COMMENT_TEXT })).toBeVisible({
      timeout: 15_000,
    });

    // 5. User A creates task from comment
    await pageA.goto(
      `/projects/${fixture.projectId}/boards/${fixture.boardId}?initiative=${fixture.initiativeId}&asset=${fixture.assetId}`,
    );
    await dismissOnboardingIfPresent(pageA);
    const commentBlock = pageA.locator("div").filter({ hasText: COMMENT_TEXT }).first();
    await expect(commentBlock).toBeVisible({ timeout: 15_000 });
    await commentBlock.getByRole("button", { name: "Comment options" }).click();
    await pageA.getByRole("menuitem", { name: "Create task" }).click();

    const followUpTaskName = COMMENT_TEXT.slice(0, 120);
    let followUpTaskId: string | undefined;
    await expect
      .poll(async () => {
        followUpTaskId = await getTaskIdByName(followUpTaskName, fixture.userAId);
        return followUpTaskId;
      }, { timeout: 15_000 })
      .toBeTruthy();

    // 6. Complete task
    await pageA.goto(`/projects/${fixture.projectId}/tasks?task=${followUpTaskId}`);
    await dismissOnboardingIfPresent(pageA);
    await expect(pageA.getByRole("heading", { name: "Task details" })).toBeVisible({
      timeout: 10_000,
    });
    await pageA.getByRole("dialog").getByRole("button", { name: "Complete task" }).click();

    // 7. Resolve comment thread (prompt appears after complete)
    await expect(pageA.getByRole("button", { name: "Resolve thread" })).toBeVisible({
      timeout: 15_000,
    });
    await pageA.getByRole("button", { name: "Resolve thread" }).click();

    // 8. For You "Needs you" item cleared for the follow-up
    await pageA.goto("/for-you?lens=needs-you");
    await dismissOnboardingIfPresent(pageA);
    await expect(
      pageA.getByRole("main").getByText(followUpTaskName, { exact: false }),
    ).not.toBeVisible({ timeout: 15_000 });

    await userAContext.close();
    await userBContext.close();
  });
});
