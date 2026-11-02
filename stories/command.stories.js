import { expect } from "storybook/test";
import "../dist/wc/navigation.mjs";

export default {
  title: "Contour/Navigation/Command",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {},
};

export const Default = {
  render: () => {
    const cmd = document.createElement("contour-command");
    cmd.setAttribute("open", "");
    return cmd;
  },
  play: async ({ canvasElement }) => {
    const cmd = canvasElement.querySelector("contour-command");
    await expect(cmd).toBeTruthy();
  },
};
