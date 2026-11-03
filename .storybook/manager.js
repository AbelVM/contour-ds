import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

// Aligned with Contour design tokens (light theme). Hex values are used because
// Storybook's theming (polished) cannot parse oklch().
const contourTheme = create({
  base: "light",
  brandTitle: "Contour",
  brandImage: "/svg/contour-mark.svg",
  brandTarget: "_self",
  colorPrimary: "#14b8a6",
  colorSecondary: "#f20084",
  appBg: "#f5f5f4",
  appContentBg: "#ffffff",
  appBorderColor: "#d9d4c8",
  appBorderRadius: 6,
  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',
  textColor: "#1f1d1a",
  textInverseColor: "#ffffff",
  barTextColor: "#1f1d1a",
  barSelectedColor: "#14b8a6",
  barBg: "#f5f5f4",
  inputBg: "#ffffff",
  inputBorder: "#d9d4c8",
  inputTextColor: "#1f1d1a",
  inputBorderRadius: 4,
});

addons.setConfig({
  theme: contourTheme,
  sidebar: {
    showRoots: true,
  },
});
