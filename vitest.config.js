import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{js,mjs,ts}"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["tools/lib/**/*.mjs", "tools/*.mjs"],
      exclude: ["**/node_modules/**"],
    },
  },
});
