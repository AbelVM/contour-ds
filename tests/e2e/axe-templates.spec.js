import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const templates = ["landing.html", "documentation.html", "dashboard.html", "map.html"];

for (const t of templates) {
  test(`axe: ${t}`, async ({ page }) => {
    await page.goto(`/${t}`.replace("//", "/"));
    // templates are under /templates/
    await page.goto(`/templates/${t}`);
    const results = await new AxeBuilder({ page }).analyze();
    // report but don't hard-fail on guide specimens; fail only on critical
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
}
