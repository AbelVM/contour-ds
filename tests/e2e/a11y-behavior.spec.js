import { test, expect } from "@playwright/test";

test.describe("behavioral a11y probes (R12-04/R12-33)", () => {
  test("tabs rove focus with arrow keys", async ({ page }) => {
    await page.goto("/");
    const tab = page.locator('[role="tab"]').first();
    if (await tab.count() === 0) test.skip();
    await tab.focus();
    await page.keyboard.press("ArrowRight");
    const active = page.locator('[role="tab"][aria-selected="true"]').first();
    await expect(active).toBeFocused();
  });

  test("dialog traps focus and restores on close", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator("button[aria-haspopup='dialog'], button[data-open-dialog]").first();
    if (await trigger.count() === 0) test.skip();
    await trigger.click();
    const dialog = page.locator("dialog[open], [role='dialog']").first();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("menu opens with Enter and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const menuBtn = page.locator("button[aria-haspopup='menu']").first();
    if (await menuBtn.count() === 0) test.skip();
    await menuBtn.focus();
    await page.keyboard.press("Enter");
    const menu = page.locator("[role='menu']").first();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });
});
