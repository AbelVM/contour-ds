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
  framework: "@storybook/web-components-vite",
  // Vite config: allow importing the shipped dist/ assets.
  viteFinal: async (config) => config,
  // Experimental: Storybook component/docs manifests (SB-18) are not enabled
  // by default because the API is still subject to change. Re-enable here
  // once the core story contract is stable, and keep agent-rules.json /
  // llms*.txt as the authoritative agent artifacts.
};
export default config;
