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

export const variantControl = (block) => ({
  control: "select",
  options: ["", ...(variantsByBlock.get(block) || [])],
});

export const booleanControls = (block) => Object.fromEntries(
  (booleansByBlock.get(block) || []).map((attribute) => [attribute, { control: "boolean" }]),
);
