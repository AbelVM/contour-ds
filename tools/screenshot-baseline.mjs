import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "tmp/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const width of [390, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto("http://127.0.0.1:4173/");
    await page.evaluate((t) => {
      document.documentElement.setAttribute("data-theme", t);
      document.documentElement.classList.toggle("dark", t === "dark");
    }, theme);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(OUT, `index-${theme}-${width}.png`), fullPage: false });
    await page.close();
  }
}
await browser.close();
console.log("screenshots written to", OUT);
