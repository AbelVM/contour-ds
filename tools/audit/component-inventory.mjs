// Full component inventory + specimen coverage + target sizes.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "/data/projects/libreship/node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core/index.mjs";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const CSS = path.join(ROOT, "src/css");
const files = fs.readdirSync(CSS).filter((f) => f.endsWith(".css"));
const blocks = new Set();
const blockFile = new Map();
for (const f of files) {
  const text = fs.readFileSync(path.join(CSS, f), "utf8");
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (sel.startsWith("@")) continue;
    for (const part of sel.split(",")) {
      const p = part.trim();
      if (!p) continue;
      for (const c of p.matchAll(/\.(c-[a-z0-9-]+)/g)) {
        const name = c[1].replace(/__.*$/, "").replace(/--.*$/, "");
        blocks.add(name);
        if (!blockFile.has(name)) blockFile.set(name, f);
      }
    }
  }
}
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const templates = fs.readdirSync(path.join(ROOT, "templates"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => fs.readFileSync(path.join(ROOT, "templates", f), "utf8"))
  .join("\n");

const noSpecimen = [];
const specimenOnly = [];
for (const b of [...blocks].sort()) {
  const inGuide = new RegExp(`class="[^"]*\\b${b}\\b`).test(html);
  const inTpl = new RegExp(`class="[^"]*\\b${b}\\b`).test(templates);
  if (!inGuide && !inTpl) noSpecimen.push(`${b}  (${blockFile.get(b)})`);
  else if (!inGuide) specimenOnly.push(`${b}  (${blockFile.get(b)})`);
}
console.log("=== COMPONENT INVENTORY ===");
console.log("distinct .c-* blocks in src/css:", blocks.size);
console.log("\n--- NO SPECIMEN ANYWHERE (guide + templates): " + noSpecimen.length + " ---");
noSpecimen.forEach((s) => console.log("  " + s));
console.log("\n--- templates only, not in the guide: " + specimenOnly.length + " ---");
specimenOnly.forEach((s) => console.log("  " + s));

/* ---------- target sizes ---------- */
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("file://" + ROOT + "/index.html", { waitUntil: "load" });
await page.waitForTimeout(800);
const targets = await page.evaluate(() => {
  const sel = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch], [role=option], [role=slider], [tabindex]:not([tabindex='-1'])";
  const small = [];
  let total = 0;
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    total++;
    if (r.width < 24 || r.height < 24) {
      small.push({
        cls: el.className.toString().slice(0, 44) || el.tagName,
        tag: el.tagName.toLowerCase(),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        text: (el.textContent || "").trim().slice(0, 18),
      });
    }
  }
  // group by class
  const byClass = {};
  for (const s of small) {
    const k = s.cls.split(" ")[0] || s.tag;
    byClass[k] = byClass[k] || { n: 0, w: s.w, h: s.h, tag: s.tag };
    byClass[k].n++;
  }
  return { total, smallCount: small.length, byClass: Object.entries(byClass).sort((a, b) => b[1].n - a[1].n) };
});
console.log("\n=== TARGET SIZES (guide, 1440px) ===");
console.log("interactive elements measured:", targets.total, " under 24px:", targets.smallCount);
for (const [k, v] of targets.byClass) console.log(`  ${k.padEnd(26)} x${v.n}  ${v.w}x${v.h}  <${v.tag}>`);

await browser.close();
