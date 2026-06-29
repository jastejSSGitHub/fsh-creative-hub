import { expect, test } from "@playwright/test";

import { dismissOnboardingIfPresent, signInUserA } from "./helpers/auth";
import { cleanupE2ETasks, ensureCollaborationFixture } from "./helpers/fixture";
import { openAssetOnBoard, projectHomeUrl, reviewBoardUrl } from "./helpers/navigation";

const SMOKE_TASK_PREFIX = "E2E smoke task";

test.describe("Hub smoke @smoke", () => {
  let fixture: Awaited<ReturnType<typeof ensureCollaborationFixture>>;

  test.beforeAll(async () => {
    fixture = await ensureCollaborationFixture();
    await cleanupE2ETasks(SMOKE_TASK_PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await signInUserA(page);
    await dismissOnboardingIfPresent(page);
  });

  test("auth: sign-in lands on projects", async ({ page }) => {
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: fixture.projectName }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("project home: shows project files", async ({ page }) => {
    await page.goto(projectHomeUrl(fixture.projectId));
    await dismissOnboardingIfPresent(page);

    await expect(page.getByRole("heading", { name: fixture.projectName }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "Review board", exact: true }).first()).toBeVisible();
  });

  test("asset overlay: opens and closes", async ({ page }) => {
    await openAssetOnBoard(page, fixture);

    await expect(page.getByRole("heading", { name: fixture.assetName })).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("heading", { name: fixture.assetName })).not.toBeVisible({
      timeout: 10_000,
    });
  });

  test("task quick-add: creates inbox task", async ({ page }) => {
    const taskName = `${SMOKE_TASK_PREFIX} ${Date.now()}`;

    await page.goto("/tasks/inbox");
    await dismissOnboardingIfPresent(page);

    const inlineAdd = page.getByPlaceholder(/add a task|what needs doing/i).first();
    await inlineAdd.fill(taskName);
    await inlineAdd.press("Enter");

    await expect(page.getByText(taskName)).toBeVisible({ timeout: 15_000 });
  });

  test("share dialog: opens from asset overlay", async ({ page }) => {
    await openAssetOnBoard(page, fixture);

    await page.getByRole("button", { name: /^share$/i }).click();
    await expect(page.getByRole("heading", { name: "Share with the room" })).toBeVisible();
    await expect(page.getByText(/anyone with the link can view/i)).toBeVisible();

    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("heading", { name: "Share with the room" })).not.toBeVisible();
  });

  test("delete confirm: cancel keeps asset on board", async ({ page }) => {
    await page.goto(reviewBoardUrl(fixture));
    await dismissOnboardingIfPresent(page);
    await expect(page.getByRole("button", { name: `Open ${fixture.assetName}` })).toBeVisible({
      timeout: 20_000,
    });

    const assetCard = page.locator(`#asset-card-${fixture.assetId}`);
    await assetCard.hover();
    await assetCard.getByRole("button", { name: "Asset options" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByRole("heading", { name: "Delete asset" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Delete asset" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: `Open ${fixture.assetName}` })).toBeVisible();
  });
});
