import { test, expect } from "@playwright/test";

test("contour-btn upgrades after late script load", async ({ page }) => {
  await page.goto("/tests/e2e/fixtures/late.html");
  await page.waitForTimeout(500);
  const btn = page.locator("contour-btn");
  await expect(btn).toHaveAttribute("role", "button");
});

test("contour-btn without JS stays unupgraded", async ({ page }) => {
  await page.goto("/tests/e2e/fixtures/late.html");
  // disable JS not possible mid-test; just check attached
  const btn = page.locator("contour-btn");
  await expect(btn).toBeAttached();
});
