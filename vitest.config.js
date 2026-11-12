import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
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
      },
      {
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook"), storybookUrl: "http://localhost:6006" }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }, { browser: "webkit" }],
          },
          server: {
            deps: {
              inline: [
                "@storybook/addon-vitest",
                "@storybook/addon-vitest/dist/vitest-plugin/setup-file-with-project-annotations.js",
              ],
            },
          },
        },
      },
    ],
  },
});
