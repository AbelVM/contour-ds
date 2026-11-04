// CVD gate: verifies that the CVD filter sprite is referenced consistently
// and that the [data-cvd] preview mechanism is wired in both CSS and JS.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const css = readFileSync(join(root, "src/css/components-data.css"), "utf8") + readFileSync(join(root, "src/css/utilities.css"), "utf8");
const js = readFileSync(join(root, "src/js/ds.js"), "utf8");
const svg = join(root, "src/svg/cvd-filters.svg");

let ok = true;
const checks = [];

// 1. CVD filters sprite exists
if (!existsSync(svg)) { checks.push("FAIL: src/svg/cvd-filters.svg missing"); ok = false; }
else checks.push("OK: cvd-filters.svg exists");

// 2. CSS references contour-cvd-* filters
const filterRefs = css.match(/url\(#contour-cvd-[a-z]+\)/g) || [];
if (filterRefs.length === 0) { checks.push("FAIL: no url(#contour-cvd-*) references in utilities.css"); ok = false; }
else checks.push(`OK: ${filterRefs.length} CVD filter references in CSS`);

// 3. JS wires [data-cvd-toggle]
if (!js.includes("data-cvd-toggle")) { checks.push("FAIL: [data-cvd-toggle] not wired in ds.js"); ok = false; }
else checks.push("OK: [data-cvd-toggle] wired in ds.js");

// 4. Guide has CVD specimen
const guide = readFileSync(join(root, "index.html"), "utf8");
if (!guide.includes("data-cvd-toggle")) { checks.push("FAIL: no CVD specimen in guide"); ok = false; }
else checks.push("OK: CVD specimen in guide");

for (const c of checks) console.log(c);
console.log(ok ? "CVD gate: PASS" : "CVD gate: FAIL");
process.exit(ok ? 0 : 1);
