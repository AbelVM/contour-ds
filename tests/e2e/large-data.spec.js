import { test, expect } from "@playwright/test";

const BUDGET_MS = 100;
const RUNS = 5;

test("1K table rows render within 100 ms p75 (CDS-064)", async ({ page, context }) => {
  const times = [];

  for (let i = 0; i < RUNS; i++) {
    // Fresh page each run to avoid cached-layout effects.
    const runPage = await context.newPage();
    let benchMs = null;

    runPage.on("console", (msg) => {
      if (msg.text().includes("__bench")) {
        // not used; we read __benchMs directly
      }
    });

    await runPage.goto("/tests/e2e/fixtures/large-data-1k.html");

    // Wait for the bench script to signal completion.
    await runPage.waitForFunction(() => window.__benchDone === true, {
      timeout: 10000,
    });

    benchMs = await runPage.evaluate(() => window.__benchMs);
    times.push(benchMs);
    await runPage.close();
  }

  times.sort((a, b) => a - b);
  const p75 = times[Math.ceil(RUNS * 0.75) - 1];
  const avg = times.reduce((a, b) => a + b, 0) / RUNS;
  const min = times[0];
  const max = times[RUNS - 1];

  console.log(
    `1K table rows: p75 ${p75.toFixed(1)} ms (avg ${avg.toFixed(1)} ms, range ${min.toFixed(1)}–${max.toFixed(1)} ms) — budget ${BUDGET_MS} ms`
  );

  expect(p75).toBeLessThanOrEqual(BUDGET_MS);
});
