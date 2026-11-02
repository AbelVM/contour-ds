import "../dist/contour.css";

/** @type { import('@storybook/web-components-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {},
      test: "error",
      options: {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      },
    },
    viewport: {
      options: {
        mobile: { name: "Mobile 390", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1440", styles: { width: "1440px", height: "900px" } },
        wide: { name: "Wide 1920", styles: { width: "1920px", height: "1080px" } },
      },
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Contour theme",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    density: {
      name: "Density",
      description: "Contour density",
      defaultValue: "default",
      toolbar: {
        icon: "ruler",
        items: [
          { value: "default", title: "Default" },
          { value: "compact", title: "Compact" },
          { value: "roomy", title: "Roomy" },
        ],
      },
    },
    motion: {
      name: "Motion",
      description: "Reduced motion",
      defaultValue: "normal",
      toolbar: {
        icon: "play",
        items: [
          { value: "normal", title: "Normal" },
          { value: "reduced", title: "Reduced" },
        ],
      },
    },
    forcedColors: {
      name: "Forced colors",
      description: "Forced colors mode",
      defaultValue: "off",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "off", title: "Off" },
          { value: "on", title: "On" },
        ],
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme || "light";
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      const density = context.globals.density || "default";
      document.documentElement.setAttribute("data-density", density);
      const motion = context.globals.motion || "normal";
      document.documentElement.classList.toggle("reduce-motion", motion === "reduced");
      const forced = context.globals.forcedColors || "off";
      document.documentElement.classList.toggle("forced-colors", forced === "on");
      return story();
    },
  ],
};

export default preview;
