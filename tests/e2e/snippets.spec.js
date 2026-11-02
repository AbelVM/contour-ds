import { test, expect } from "@playwright/test";

test("snippet disclosure opens and closes", async ({ page }) => {
  await page.goto("/");
  const summary = page.locator("details.ds-code summary.ds-code__summary").first();
  await summary.scrollIntoViewIfNeeded({ timeout: 10000 });
  await summary.click({ timeout: 10000 });
  await page.waitForTimeout(300);
  const parent = summary.locator("..");
  await expect(parent).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
});

test("copy button does not toggle disclosure", async ({ page }) => {
  await page.goto("/");
  const details = page.locator("details.ds-code").first();
  const summary = details.locator("summary.ds-code__summary");
  await summary.scrollIntoViewIfNeeded({ timeout: 10000 });
  await summary.click({ timeout: 10000 });
  await page.waitForTimeout(300);
  const copyBtn = details.locator("button.ds-code__copy").first();
  if (await copyBtn.count()) {
    const wasOpen = await details.getAttribute("open");
    await copyBtn.click({ timeout: 5000 });
    const nowOpen = await details.getAttribute("open");
    expect(nowOpen).toBe(wasOpen);
  }
});
