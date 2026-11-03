import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

// Aligned with Contour design tokens (light theme).
const contourTheme = create({
  base: "light",
  brandTitle: "Contour",
  brandImage: "/svg/contour-mark.svg",
  brandTarget: "_self",
  colorPrimary: "oklch(50% 0.115 182.5)",
  colorSecondary: "oklch(62.36% 0.2534 358.92)",
  appBg: "oklch(96.6% 0.005 230)",
  appContentBg: "oklch(100% 0 0)",
  appBorderColor: "oklch(85% 0.01 230)",
  appBorderRadius: 6,
  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',
  textColor: "oklch(33% 0.02 230)",
  textInverseColor: "oklch(99% 0.01 182.5)",
  barTextColor: "oklch(33% 0.02 230)",
  barSelectedColor: "oklch(50% 0.115 182.5)",
  barBg: "oklch(96.6% 0.005 230)",
  inputBg: "oklch(100% 0 0)",
  inputBorder: "oklch(85% 0.01 230)",
  inputTextColor: "oklch(33% 0.02 230)",
  inputBorderRadius: 4,
});

addons.setConfig({
  theme: contourTheme,
  sidebar: {
    showRoots: true,
  },
});
