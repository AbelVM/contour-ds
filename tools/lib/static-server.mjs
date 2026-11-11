/**
 * A dependency-free static file server for the built Storybook.
 *
 * A static Storybook cannot be opened over `file://`: its iframe loads ES
 * modules and a stylesheet, and Chromium refuses both at that origin. Every
 * harness that needs the build (visual regression, interaction tests) serves
 * it over loopback instead of screenshotting an empty page.
 */

import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".ico": "image/x-icon",
};

/**
 * Serve `dir` on loopback. Port 0 picks an ephemeral port.
 * @returns {Promise<{url: string, close: () => Promise<void>}>}
 */
export async function serveStatic(dir, port = 0) {
  const server = createServer((req, res) => {
    const raw = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = join(dir, raw === "/" ? "index.html" : raw);
    if (!file.startsWith(dir)) { res.writeHead(403); res.end(); return; }
    try {
      if (statSync(file).isDirectory()) file = join(file, "index.html");
    } catch {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const body = readFileSync(file);
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}