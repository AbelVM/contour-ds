import { expect } from "storybook/test";
import "../dist/wc/feedback.mjs";

export default {
  title: "Contour/Feedback/Toast",
  tags: ["autodocs"],
  parameters: { contour: { maturity: "complete-widget" } },
  argTypes: {
    message: { control: "text" },
    variant: { control: "text" },
    duration: { control: "text" },
  },
};

const render = (args = {}) => {
  const t = document.createElement("contour-toast");
  if (args.variant) t.setAttribute("variant", args.variant);
  if (args.duration) t.setAttribute("duration", args.duration);
  if (args.message) t.textContent = args.message;
  else t.textContent = "Saved successfully";
  return t;
};

export const Default = {
  args: { message: "Saved successfully" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    await expect(t).toHaveClass(/c-toast/);
    await expect(canvasElement.textContent).toContain("Saved");
  },
};

export const Reactivity = {
  args: { message: "Saved successfully" },
  render,
  play: async ({ canvasElement }) => {
    const t = canvasElement.querySelector("contour-toast");
    await expect(t).toBeTruthy();
    t.textContent = "Updated";
    await expect(canvasElement.textContent).toContain("Updated");
  },
};


export const ToastHostAsyncAction = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "0.75rem";
    const host = document.createElement("contour-toast-host");
    host.setAttribute("id", "demo-toast-host");
    const btn = document.createElement("button");
    btn.className = "c-button";
    btn.type = "button";
    btn.textContent = "Trigger async action";
    const status = document.createElement("p");
    status.id = "toast-async-status";
    status.textContent = "idle";
    btn.addEventListener("click", async () => {
      status.textContent = "loading";
      await new Promise((r) => setTimeout(r, 10));
      host.show("Saved successfully", { variant: "success", duration: 1200 });
      status.textContent = "done";
    });
    wrap.append(host, btn, status);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("contour-toast-host");
    const btn = canvasElement.querySelector("button");
    const status = canvasElement.querySelector("#toast-async-status");
    await expect(host).toBeTruthy();
    await expect(host).toHaveAttribute("role", "status");
    await expect(host).toHaveAttribute("aria-live", "polite");
    await expect(host).toHaveAttribute("aria-atomic", "true");
    btn.click();
    await new Promise((r) => setTimeout(r, 30));
    await expect(status.textContent).toBe("done");
    await expect(host.querySelector(".c-toast")).toBeTruthy();
    await expect(host.textContent).toContain("Saved successfully");
  },
};
