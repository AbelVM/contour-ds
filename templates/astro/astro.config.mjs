import { defineConfig } from "astro/config";

export default defineConfig({
  // Resolve contour-ds from the local checkout until published to npm.
  vite: {
    resolve: {
      alias: {
        "contour-ds": new URL("../../src", import.meta.url).pathname,
      },
    },
  },
});
