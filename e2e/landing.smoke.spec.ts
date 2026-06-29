import { expect, test } from "@playwright/test";

test.describe("Landing page smoke @smoke", () => {
  test("loads hero, nav, and primary CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "FSH Creative Hub" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /creative work/i })).toBeVisible();
    await expect(page.getByText(/one place to/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /enter the hub/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Landing" })).toBeVisible();
  });

  test("anchor nav scrolls to features section", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("navigation", { name: "Landing" }).getByRole("link", { name: "Features" }).click();
    await expect(page.locator("#features")).toBeInViewport({ timeout: 10_000 });
  });

  test("docs link opens documentation", async ({ page }) => {
    await page.goto("/");

    const docsLink = page.getByRole("navigation", { name: "Landing" }).getByRole("link", { name: "Docs" });
    await expect(docsLink).toHaveAttribute("href", "/docs");
    await expect(docsLink).toHaveAttribute("target", "_blank");

    await page.goto("/docs");
    await expect(page.getByRole("heading", { level: 1, name: "Documentation" })).toBeVisible();
  });

  test("mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("link", { name: "Features" }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "How it works" }).last()).toBeVisible();

    await page.getByRole("banner").getByRole("button", { name: "Close menu" }).click();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });
});
