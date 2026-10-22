#!/usr/bin/env node
/**
 * Token census gate.
 *
 * Fails the build if any custom property declared in src/css/tokens.css is
 * never referenced by a var() anywhere in src/, index.html or templates/.
 *
 * A token that nothing reads is not a token; it is a wish. This gate makes
 * that a build error rather than a review finding.
 *
 * Run: node tools/check-tokens.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CSS = join(ROOT, "src/css");
const files = readdirSync(CSS).filter((f) => f.endsWith(".css"));
const allSrc = files.map((f) => readFileSync(join(CSS, f), "utf8")).join("\n");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const templates = readdirSync(join(ROOT, "templates"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => readFileSync(join(ROOT, "templates", f), "utf8"))
  .join("\n");
const haystack = allSrc + "\n" + html + "\n" + templates;

const tokensCss = readFileSync(join(CSS, "tokens.css"), "utf8");
const declared = [...new Set(tokensCss.match(/(--[a-z0-9-]+)\s*:/g).map((m) => m.replace(/\s*:/, "")))];

// Primitive ramp steps and layout tokens are part of the documented ramp and
// are meant to be consumed directly by products. They are not "dead" in the
// same sense as a semantic token that nothing reads.
const PRIMITIVE = /^--(basalt|tidal|lumen|plasma|sol|clay|brand|color-heat|chart)-[0-9]+$/;
const LAYOUT = /^--(space-|z-|container-|shadow-|dur-|ease-|border-width)/;

const orphans = declared.filter((t) => {
  if (PRIMITIVE.test(t)) return false;
  if (LAYOUT.test(t)) return false;
  const re = new RegExp("var\\(\\s*" + t.replace(/[-]/g, "\\-") + "\\b", "g");
  return !re.test(haystack);
});

if (orphans.length > 0) {
  console.error("check-tokens: " + orphans.length + " declared token(s) are never read.\n");
  for (const t of orphans) console.error("  " + t);
  console.error("\nEither wire the token to a consumer or remove it.");
  process.exit(1);
}
console.log("check-tokens: all " + declared.length + " tokens are referenced. OK");
