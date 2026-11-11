import{n as e}from"./rolldown-runtime-sJBDdmOt.js";var t,n,r,i,a;function o(){return(o=e((()=>{({expect:t,userEvent:n}=__STORYBOOK_MODULE_TEST__),r={title:`Contour/Compositions/WorkspaceShell`,tags:[`autodocs`],parameters:{contour:{maturity:`composition`}}},i={render:()=>{let e=document.createElement(`div`);e.className=`c-workspace-shell`,e.style.minHeight=`24rem`;let t=document.createElement(`contour-header`);t.setAttribute(`brand`,`Contour Workspace`),t.setAttribute(`nav`,JSON.stringify([{label:`Dashboard`,href:`#dashboard`,current:!0},{label:`Layers`,href:`#layers`},{label:`Settings`,href:`#settings`}]));let n=document.createElement(`div`);n.className=`c-workspace-shell__body`;let r=document.createElement(`aside`);r.className=`c-workspace-shell__sidebar c-panel`,r.style.padding=`var(--space-sm)`,r.innerHTML=`
      <h3>Navigation</h3>
      <nav aria-label="Workspace sections">
        <ul style="margin:0;padding:0;list-style:none;display:grid;gap:0.25rem">
          <li><a href="#overview" aria-current="page">Overview</a></li>
          <li><a href="#routes">Routes</a></li>
          <li><a href="#reports">Reports</a></li>
        </ul>
      </nav>`;let i=document.createElement(`main`);i.className=`c-workspace-shell__stage c-panel`,i.style.padding=`var(--space-sm)`,i.innerHTML=`
      <button class="c-workspace-shell__inspector-toggle" type="button" popovertarget="workspace-inspector">Inspector</button>
      <h3 id="workspace-stage-title">Central stage</h3>
      <p id="workspace-stage-status">Overview selected</p>
      <div class="c-table-wrap" style="margin-top:0.5rem">
        <contour-table columns='["Region","Volume","Status"]' rows='[["North","842","Open"],["South","617","Review"]]'></contour-table>
      </div>`;let a=document.createElement(`contour-resize-handle`);a.className=`c-workspace-shell__resize`,a.setAttribute(`label`,`Resize inspector`);let o=document.createElement(`contour-panel`);return o.className=`c-workspace-shell__inspector`,o.id=`workspace-inspector`,o.setAttribute(`popover`,``),o.setAttribute(`title`,`Docked inspector`),o.setAttribute(`subtitle`,`Selection details`),o.setAttribute(`collapsible`,``),o.innerHTML=`
      <contour-kpi label="Coverage" value="96%"></contour-kpi>
      <p style="margin-top:0.5rem">Inspector remains docked beside the central stage.</p>`,n.append(r,i,a,o),e.append(t,n),r.addEventListener(`click`,e=>{let t=e.target&&e.target.closest?e.target.closest(`a`):null;t&&(e.preventDefault(),r.querySelectorAll(`a`).forEach(e=>e.removeAttribute(`aria-current`)),t.setAttribute(`aria-current`,`page`),i.querySelector(`#workspace-stage-status`).textContent=`${t.textContent} selected`)}),e},play:async({canvasElement:e})=>{let r=e.querySelector(`.c-workspace-shell`),i=e.querySelector(`contour-header`),a=e.querySelector(`aside nav`),o=e.querySelector(`main`),s=e.querySelector(`contour-resize-handle`),c=e.querySelector(`contour-panel`),l=e.querySelector(`contour-table`),u=e.querySelector(`#workspace-stage-status`);await t(r).toBeTruthy(),await t(i).toBeTruthy(),await t(a).toBeTruthy(),await t(o).toBeTruthy(),await t(s).toBeTruthy(),await t(c).toBeTruthy(),await t(l).toBeTruthy(),await t(c).toHaveAttribute(`title`,`Docked inspector`),await t(c).toHaveAttribute(`popover`,``),await t(e.querySelector(`.c-workspace-shell__inspector-toggle`)).toBeTruthy(),await t(e.querySelector(`.c-workspace-shell__body`)).toBeTruthy();let d=a.querySelectorAll(`a`)[1];await n.click(d),await t(u.textContent).toBe(`Routes selected`),await t(d).toHaveAttribute(`aria-current`,`page`)}},a=[`DockWorkspaceShell`],i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const root = document.createElement("div");
    root.className = "c-workspace-shell";
    root.style.minHeight = "24rem";
    const header = document.createElement("contour-header");
    header.setAttribute("brand", "Contour Workspace");
    header.setAttribute("nav", JSON.stringify([{
      label: "Dashboard",
      href: "#dashboard",
      current: true
    }, {
      label: "Layers",
      href: "#layers"
    }, {
      label: "Settings",
      href: "#settings"
    }]));
    const body = document.createElement("div");
    body.className = "c-workspace-shell__body";
    const sidebar = document.createElement("aside");
    sidebar.className = "c-workspace-shell__sidebar c-panel";
    sidebar.style.padding = "var(--space-sm)";
    sidebar.innerHTML = \`
      <h3>Navigation</h3>
      <nav aria-label="Workspace sections">
        <ul style="margin:0;padding:0;list-style:none;display:grid;gap:0.25rem">
          <li><a href="#overview" aria-current="page">Overview</a></li>
          <li><a href="#routes">Routes</a></li>
          <li><a href="#reports">Reports</a></li>
        </ul>
      </nav>\`;
    const stage = document.createElement("main");
    stage.className = "c-workspace-shell__stage c-panel";
    stage.style.padding = "var(--space-sm)";
    stage.innerHTML = \`
      <button class="c-workspace-shell__inspector-toggle" type="button" popovertarget="workspace-inspector">Inspector</button>
      <h3 id="workspace-stage-title">Central stage</h3>
      <p id="workspace-stage-status">Overview selected</p>
      <div class="c-table-wrap" style="margin-top:0.5rem">
        <contour-table columns='["Region","Volume","Status"]' rows='[["North","842","Open"],["South","617","Review"]]'></contour-table>
      </div>\`;
    const handle = document.createElement("contour-resize-handle");
    handle.className = "c-workspace-shell__resize";
    handle.setAttribute("label", "Resize inspector");
    const inspector = document.createElement("contour-panel");
    inspector.className = "c-workspace-shell__inspector";
    inspector.id = "workspace-inspector";
    inspector.setAttribute("popover", "");
    inspector.setAttribute("title", "Docked inspector");
    inspector.setAttribute("subtitle", "Selection details");
    inspector.setAttribute("collapsible", "");
    inspector.innerHTML = \`
      <contour-kpi label="Coverage" value="96%"></contour-kpi>
      <p style="margin-top:0.5rem">Inspector remains docked beside the central stage.</p>\`;
    body.append(sidebar, stage, handle, inspector);
    root.append(header, body);

    // Lightweight composition behavior: reflect nav clicks in stage status.
    sidebar.addEventListener("click", e => {
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      e.preventDefault();
      sidebar.querySelectorAll("a").forEach(link => link.removeAttribute("aria-current"));
      a.setAttribute("aria-current", "page");
      stage.querySelector("#workspace-stage-status").textContent = \`\${a.textContent} selected\`;
    });
    return root;
  },
  play: async ({
    canvasElement
  }) => {
    const root = canvasElement.querySelector(".c-workspace-shell");
    const header = canvasElement.querySelector("contour-header");
    const sidebar = canvasElement.querySelector("aside nav");
    const stage = canvasElement.querySelector("main");
    const handle = canvasElement.querySelector("contour-resize-handle");
    const inspector = canvasElement.querySelector("contour-panel");
    const table = canvasElement.querySelector("contour-table");
    const status = canvasElement.querySelector("#workspace-stage-status");
    await expect(root).toBeTruthy();
    await expect(header).toBeTruthy();
    await expect(sidebar).toBeTruthy();
    await expect(stage).toBeTruthy();
    await expect(handle).toBeTruthy();
    await expect(inspector).toBeTruthy();
    await expect(table).toBeTruthy();
    await expect(inspector).toHaveAttribute("title", "Docked inspector");
    await expect(inspector).toHaveAttribute("popover", "");
    await expect(canvasElement.querySelector(".c-workspace-shell__inspector-toggle")).toBeTruthy();
    await expect(canvasElement.querySelector(".c-workspace-shell__body")).toBeTruthy();
    const routes = sidebar.querySelectorAll("a")[1];
    await userEvent.click(routes);
    await expect(status.textContent).toBe("Routes selected");
    await expect(routes).toHaveAttribute("aria-current", "page");
  }
}`,...i.parameters?.docs?.source}}}})))()}o();export{i as DockWorkspaceShell,a as __namedExportsOrder,r as default};