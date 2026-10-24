#!/usr/bin/env node
import { createRequire } from "node:module";
const require_ = createRequire(import.meta.url);
const { chromium } = require_(require_.resolve("playwright-core", { paths: ["tools/audit/node_modules"] }));
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("dist/contour.single.html");
if (!existsSync(file)) {
  console.error("smoke-single: dist/contour.single.html missing — run `node tools/build.mjs --single`");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));

await page.goto("file://" + file);
const hasContour = await page.evaluate(() => typeof window.Contour === "object" && window.Contour !== null);

await browser.close();

if (errors.length) {
  console.error("smoke-single: console errors:");
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
if (!hasContour) {
  console.error("smoke-single: window.Contour is not defined");
  process.exit(1);
}
console.log("smoke-single: OK — no console errors, window.Contour defined");
