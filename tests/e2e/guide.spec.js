import { test, expect } from "@playwright/test";

test("guide loads and has h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
});

test("theme set switches data-theme", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");
  const btn = page.locator("button[data-theme-value='daylight']").first();
  await btn.click();
  const after = await html.getAttribute("data-theme");
  expect(after).toBe("daylight");
  // restore
  const def = page.locator("button[data-theme-value]").first();
  await def.click();
});

test("no horizontal scroll at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

test("no horizontal scroll at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});
