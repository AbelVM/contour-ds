import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const contourTheme = create({
  base: "light",
  brandTitle: "Contour",
  brandImage: "/svg/contour-mark.svg",
  brandTarget: "_self",
  colorPrimary: "#2f8f83",
  colorSecondary: "#d97757",
  appBg: "#f7f5f0",
  appContentBg: "#ffffff",
  appBorderColor: "#d9d4c8",
  appBorderRadius: 6,
  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',
  textColor: "#1f1d1a",
  textInverseColor: "#f7f5f0",
  barTextColor: "#1f1d1a",
  barSelectedColor: "#2f8f83",
  barBg: "#f7f5f0",
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
