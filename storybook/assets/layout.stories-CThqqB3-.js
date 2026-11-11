import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a,o,s,c,l,u,d,f;function p(){return(p=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Layout/Primitives`,tags:[`autodocs`],parameters:{contour:{maturity:`primitive`}}},i=(e,t)=>{let n=document.createElement(e);return n.textContent=t||e,n},a={render:()=>i(`contour-box`,`Box`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-box`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-box/)}},o={render:()=>i(`contour-cluster`,`Cluster`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-cluster`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-cluster/)}},s={render:()=>i(`contour-container`,`Container`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-container`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-container/)}},c={render:()=>i(`contour-row`,`Row`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-row`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-row/)}},l={render:()=>i(`contour-scrim`,`Scrim`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-scrim`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-scrim/)}},u={render:()=>i(`contour-stack`,`Stack`),play:async({canvasElement:e})=>{let n=e.querySelector(`contour-stack`);await t(n).toBeTruthy(),await t(n).toHaveClass(/c-stack/)}},d={render:()=>{let e=document.createElement(`div`);e.style.display=`grid`,e.style.gridTemplateColumns=`240px 1fr`,e.style.gap=`1rem`,e.style.minHeight=`16rem`;let t=document.createElement(`contour-sidebar`);t.setAttribute(`title`,`Navigation`),t.setAttribute(`items`,JSON.stringify([{label:`Overview`,href:`#overview`},{label:`Layers`,href:`#layers`},{label:`Settings`,href:`#settings`}]));let n=document.createElement(`button`);n.className=`c-button c-button--secondary c-sidebar__toggle`,n.type=`button`,n.textContent=`Toggle sidebar`;let r=document.createElement(`main`);r.className=`c-panel`,r.innerHTML=`<h3>Workspace</h3><p id='sidebar-shell-status'>expanded</p>`;let i=document.createElement(`aside`);t.prepend(n),i.append(t),e.append(i,r);let a=()=>{let n=t.hasAttribute(`collapsed`);e.style.gridTemplateColumns=n?`4rem 1fr`:`240px 1fr`,r.querySelector(`#sidebar-shell-status`).textContent=n?`collapsed`:`expanded`};return t.addEventListener(`contour:toggle`,a),a(),e},play:async({canvasElement:e})=>{let r=e.querySelector(`contour-sidebar`),i=e.querySelector(`.c-sidebar__toggle`),a=e.querySelector(`#sidebar-shell-status`);await t(r).toBeTruthy(),await t(r).toHaveAttribute(`role`,`navigation`),await t(a.textContent).toBe(`expanded`),await n.click(i),await t(r).toHaveAttribute(`collapsed`,``),await t(a.textContent).toBe(`collapsed`)}},f=[`Box`,`Cluster`,`Container`,`Row`,`Scrim`,`Stack`,`SidebarResponsiveShell`],a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-box", "Box"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-box");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-box/);
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-cluster", "Cluster"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-cluster");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-cluster/);
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-container", "Container"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-container");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-container/);
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-row", "Row"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-row");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-row/);
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-scrim", "Scrim"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-scrim");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-scrim/);
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => wrap("contour-stack", "Stack"),
  play: async ({
    canvasElement
  }) => {
    const el = canvasElement.querySelector("contour-stack");
    await expect(el).toBeTruthy();
    await expect(el).toHaveClass(/c-stack/);
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const shell = document.createElement("div");
    shell.style.display = "grid";
    shell.style.gridTemplateColumns = "240px 1fr";
    shell.style.gap = "1rem";
    shell.style.minHeight = "16rem";
    const sidebar = document.createElement("contour-sidebar");
    sidebar.setAttribute("title", "Navigation");
    sidebar.setAttribute("items", JSON.stringify([{
      label: "Overview",
      href: "#overview"
    }, {
      label: "Layers",
      href: "#layers"
    }, {
      label: "Settings",
      href: "#settings"
    }]));
    const toggle = document.createElement("button");
    toggle.className = "c-button c-button--secondary c-sidebar__toggle";
    toggle.type = "button";
    toggle.textContent = "Toggle sidebar";
    const main = document.createElement("main");
    main.className = "c-panel";
    main.innerHTML = "<h3>Workspace</h3><p id='sidebar-shell-status'>expanded</p>";
    const aside = document.createElement("aside");
    // The toggle belongs inside the sidebar: \`contour-sidebar\` wires the
    // \`.c-sidebar__toggle\` it contains and emits \`contour:toggle\`. A button
    // placed beside the host would be a control nobody listens to.
    sidebar.prepend(toggle);
    aside.append(sidebar);
    shell.append(aside, main);
    const sync = () => {
      const collapsed = sidebar.hasAttribute("collapsed");
      shell.style.gridTemplateColumns = collapsed ? "4rem 1fr" : "240px 1fr";
      main.querySelector("#sidebar-shell-status").textContent = collapsed ? "collapsed" : "expanded";
    };
    sidebar.addEventListener("contour:toggle", sync);
    sync();
    return shell;
  },
  play: async ({
    canvasElement
  }) => {
    const sidebar = canvasElement.querySelector("contour-sidebar");
    const toggle = canvasElement.querySelector(".c-sidebar__toggle");
    const status = canvasElement.querySelector("#sidebar-shell-status");
    await expect(sidebar).toBeTruthy();
    await expect(sidebar).toHaveAttribute("role", "navigation");
    await expect(status.textContent).toBe("expanded");
    await userEvent.click(toggle);
    await expect(sidebar).toHaveAttribute("collapsed", "");
    await expect(status.textContent).toBe("collapsed");
  }
}`,...d.parameters?.docs?.source}}}})))()}p();export{a as Box,o as Cluster,s as Container,c as Row,l as Scrim,d as SidebarResponsiveShell,u as Stack,f as __namedExportsOrder,r as default};