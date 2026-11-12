import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const wcDir = join(root, "dist", "wc");
const output = join(root, "stories", "registered-elements.stories.js");
const tags = new Set();

for (const file of readdirSync(wcDir)) {
  const source = readFileSync(join(wcDir, file), "utf8");
  for (const match of source.matchAll(/define\("([^"]+)"\s*,/g)) tags.add(match[1]);
}

// Per-block maturity from the inventory, so a generated story carries the same
// maturity the inventory records rather than a blanket "composition" (R18-23).
const inventory = JSON.parse(readFileSync(join(root, "dist", "contour.components.json"), "utf8"));
const maturityByBlock = new Map(inventory.blocks.map((b) => [b.name, b.maturity]));
const maturityFor = (tag) => maturityByBlock.get("c-" + tag.replace(/^contour-/, "")) || "composition";

const name = (tag) => tag
  .replace(/^contour-/, "")
  .split("-")
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join("");

const stories = [...tags].sort().map((tag) => {
  const n = name(tag);
  const m = maturityFor(tag);
  return `export const ${n} = { ...makeStory("${tag}"), parameters: { contour: { maturity: "${m}" } } };\nexport const ${n}Playground = { ...makeStory("${tag}"), parameters: { contour: { maturity: "${m}" } } };`;
}).join("\n");
const content = `import { expect } from "storybook/test";
import "../dist/wc/content.mjs";
import "../dist/wc/dashboard.mjs";
import "../dist/wc/data.mjs";
import "../dist/wc/docs.mjs";
import "../dist/wc/feedback.mjs";
import "../dist/wc/forms.mjs";
import "../dist/wc/interaction.mjs";
import "../dist/wc/layout.mjs";
import "../dist/wc/map.mjs";
import "../dist/wc/misc.mjs";
import "../dist/wc/navigation.mjs";
import "../dist/wc/registration.mjs";
import "../dist/wc/shadow.mjs";
import "../dist/wc/ui.mjs";
import "../dist/contour.css";
import { applyFixture, fixtureArgs } from "./fixtures.js";
import { controlsForTag } from "./metadata.js";

export default {
  title: "Contour/Elements",
  tags: ["autodocs"],
  parameters: {
    a11y: { test: "todo" },
    issue: "SB-04a",
    a11yTodo: {
      owner: "Contour maintainers",
      rootCause: "generated catalogue spans incomplete contexts",
      mitigation: "promote mature elements to focused stories",
      review: "2026-12-01",
    },
  },
};

function makeStory(tag) {
  return {
    args: fixtureArgs(tag),
    argTypes: controlsForTag(tag),
    render: (args) => {
      const element = applyFixture(document.createElement(tag), tag);
      for (const [name, value] of Object.entries(args)) {
        if (value === undefined) continue;
        element.setAttribute(name, String(value));
      }
      return element;
    },
    play: async ({ canvasElement }) => {
      const element = canvasElement.querySelector(tag);
      await expect(element).toBeTruthy();
      if (Object.keys(fixtureArgs(tag)).length) {
        await expect(element.textContent).not.toMatch(/no data/i);
      }
    },
  };
}

${stories}
`;

writeFileSync(output, content);
console.log(`generated ${tags.size} registered-element stories`);