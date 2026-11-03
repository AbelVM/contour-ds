/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],
  staticDirs: ["../dist"],
  framework: "@storybook/web-components-vite",
  viteFinal: async (config) => {
    config.build = config.build || {};
    config.build.rollupOptions = config.build.rollupOptions || {};
    config.build.rollupOptions.output = config.build.rollupOptions.output || {};
    config.build.rollupOptions.output.manualChunks = (id) => {
      if (id.includes("contour-wc")) return "contour-wc";
      return undefined;
    };
    return config;
  },
};
export default config;
