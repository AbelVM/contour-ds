import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolve contour-ds from the local checkout until it is published to npm.
  // Replace with `import "contour-ds/contour.min.css"` once published.
  resolve: {
    alias: {
      "contour-ds": new URL("../../src", import.meta.url).pathname,
    },
  },
});
