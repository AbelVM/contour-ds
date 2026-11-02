import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://127.0.0.1:6006/iframe.html?id=contour-interaction-button--default&viewMode=story");
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const sheets = [...document.styleSheets];
  return sheets.map((s, i) => ({ i, href: s.href, rules: s.cssRules?.length, owner: s.ownerNode?.tagName }));
});
console.log("SHEETS:", JSON.stringify(info, null, 2));
await browser.close();
