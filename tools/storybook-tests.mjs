#!/usr/bin/env node
/**
 * Run the Storybook interaction/a11y suite against a static build.
 *
 * `vitest --project storybook` points at `http://localhost:6006`, so the suite
 * needs a server. Starting one here — and closing it afterwards — makes
 * `npm run test:storybook` work from a clean checkout instead of hanging on a
 * port nobody is listening on.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { serveStatic } from "./lib/static-server.mjs";

const ROOT = process.cwd();
const BUILD = join(ROOT, "storybook");
const PORT = 6006;

if (!existsSync(join(BUILD, "index.html"))) {
  console.error("storybook-tests: storybook/index.html is missing — run `npm run build-storybook` first.");
  process.exit(1);
}

const server = await serveStatic(BUILD, PORT);
console.log(`storybook-tests: serving ${join("storybook")} at ${server.url}`);

const child = spawn("npx", ["vitest", "run", "--project", "storybook"], {
  stdio: "inherit",
  env: process.env,
});

const code = await new Promise((resolve) => child.on("exit", (c, signal) => resolve(c == null ? (signal ? 1 : 0) : c)));
await server.close();
process.exit(code);