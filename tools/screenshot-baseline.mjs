import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.STORYBOOK_URL || "http://127.0.0.1:6006";
const OUT = process.env.SCREENSHOT_OUT || "tmp/screenshots";
mkdirSync(OUT, { recursive: true });

// A small, stable set of stories for visual review.
const STORIES = [
  "contour-interaction-button--default",
  "contour-interaction-button--primary",
  "contour-forms-input--default",
  "contour-overlays-dialog--default",
  "contour-navigation-tabs--default",
  "contour-data-chart--default",
  "contour-data-table--default",
  "contour-feedback-toast--default",
];

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const width of [390, 1440]) {
    for (const story of STORIES) {
      const page = await browser.newPage();
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      const url = `${BASE}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.addStyleTag({
          content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
        });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate((t) => {
          document.documentElement.setAttribute("data-theme", t);
          document.documentElement.style.colorScheme = t;
          document.documentElement.classList.toggle("dark", t === "dark");
        }, theme);
        await page.waitForTimeout(100);
        await page.screenshot({ path: join(OUT, `${story}-${theme}-${width}.png`), fullPage: false });
      } catch (e) {
        console.error("screenshot failed", story, theme, width, e.message);
      }
      await page.close();
    }
  }
}
await browser.close();
console.log("screenshots written to", OUT);
