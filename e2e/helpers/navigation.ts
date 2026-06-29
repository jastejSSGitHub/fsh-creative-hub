import type { Page } from "@playwright/test";

import { dismissOnboardingIfPresent } from "./auth";
import type { E2EFixture } from "./fixture";

export function reviewBoardUrl(fixture: E2EFixture, assetId?: string) {
  const params = new URLSearchParams({ initiative: fixture.initiativeId });
  if (assetId) params.set("asset", assetId);
  return `/projects/${fixture.projectId}/boards/${fixture.boardId}?${params.toString()}`;
}

export function projectHomeUrl(projectId: string) {
  return `/projects/${projectId}`;
}

export async function openAssetOnBoard(page: Page, fixture: E2EFixture) {
  await page.goto(reviewBoardUrl(fixture));
  await dismissOnboardingIfPresent(page);
  await page.getByRole("button", { name: `Open ${fixture.assetName}` }).click();
  await page.getByRole("heading", { name: fixture.assetName }).waitFor({ timeout: 20_000 });
}
