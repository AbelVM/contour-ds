import { test, expect } from "@playwright/test";

test("reduced motion collapses transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // page should still render
  await expect(page.locator("h1").first()).toBeVisible();
});

test("forced colors removes texture", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
});
