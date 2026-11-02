import inventory from "../dist/contour.components.json";

const variantsByBlock = new Map(
  inventory.blocks.map(({ name, variants }) => [
    name,
    variants
      .filter((value) => value.startsWith(`${name}--`))
      .map((value) => value.slice(name.length + 2)),
  ]),
);

const booleansByBlock = new Map(
  inventory.blocks.map(({ name, booleanAttributes = [] }) => [name, booleanAttributes]),
);

const attributesByTag = new Map(
  inventory.blocks.map(({ name, attributes = [], booleanAttributes = [] }) => [
    `contour-${name.slice(2)}`,
    { attributes, booleanAttributes },
  ]),
);

export const variantControl = (block) => ({
  control: "select",
  options: ["", ...(variantsByBlock.get(block) || [])],
});

export const booleanControls = (block) => Object.fromEntries(
  (booleansByBlock.get(block) || []).map((attribute) => [attribute, { control: "boolean" }]),
);

export const controlsForTag = (tag) => {
  const metadata = attributesByTag.get(tag);
  if (!metadata) return {};
  const booleans = new Set(metadata.booleanAttributes);
  return Object.fromEntries(metadata.attributes.map((attribute) => [
    attribute,
    booleans.has(attribute) ? { control: "boolean" } : { control: "text" },
  ]));
};
