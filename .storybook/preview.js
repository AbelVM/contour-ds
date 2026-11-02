import "../dist/contour.css";
import "../dist/contour-wc.esm.js";

// Inject the contour stylesheet as a link tag if Vite's CSS injection did not
// apply (defensive: the import above is the primary path).
if (typeof document !== "undefined" && !document.querySelector('link[href*="contour.css"]')) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/contour.css";
  document.head.appendChild(link);
}

/** @type { import('@storybook/web-components-vite').Preview } */
const globalTypes = {
  theme: {
    name: "Theme",
    description: "Contour theme",
    defaultValue: "light",
    toolbar: {
      title: "Theme",
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
      title: "Density",
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
      title: "Motion",
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
      title: "Forced colors",
      icon: "paintbrush",
      items: [
        { value: "off", title: "Off" },
        { value: "on", title: "On" },
      ],
    },
  },
};

const decorators = [
  (story, context) => {
    const theme = context.globals.theme || "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    let colorScheme = document.head.querySelector('meta[name="color-scheme"]');
    if (!colorScheme) {
      colorScheme = document.createElement("meta");
      colorScheme.name = "color-scheme";
      document.head.appendChild(colorScheme);
    }
    colorScheme.content = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    const density = context.globals.density || "default";
    document.documentElement.setAttribute("data-density", density);
    const motion = context.globals.motion || "normal";
    document.documentElement.classList.toggle("reduce-motion", motion === "reduced");
    let motionStyle = document.head.querySelector("#storybook-motion-mode");
    if (!motionStyle) {
      motionStyle = document.createElement("style");
      motionStyle.id = "storybook-motion-mode";
      document.head.appendChild(motionStyle);
    }
    motionStyle.textContent = motion === "reduced"
      ? ".reduce-motion, .reduce-motion *, .reduce-motion *::before, .reduce-motion *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }"
      : "";
    const forced = context.globals.forcedColors || "off";
    document.documentElement.classList.toggle("forced-colors", forced === "on");
    let forcedColorsStyle = document.head.querySelector("#storybook-forced-colors");
    if (!forcedColorsStyle) {
      forcedColorsStyle = document.createElement("style");
      forcedColorsStyle.id = "storybook-forced-colors";
      document.head.appendChild(forcedColorsStyle);
    }
    forcedColorsStyle.textContent = forced === "on"
      ? ".forced-colors, .forced-colors * { forced-color-adjust: none !important; } .forced-colors body { background: Canvas !important; color: CanvasText !important; } .forced-colors button, .forced-colors input, .forced-colors select, .forced-colors textarea { background: ButtonFace !important; color: ButtonText !important; border-color: ButtonText !important; }"
      : "";
    return story();
  },
];

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
  globalTypes,
  decorators,
};

export { decorators, globalTypes };
export default preview;
