import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{js,mjs,ts}"],
    environment: "node",
    testTimeout: 120000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
      include: ["tools/lib/**/*.mjs"],
      exclude: ["**/node_modules/**"],
    },
  },
});
