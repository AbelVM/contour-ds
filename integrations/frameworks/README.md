# Framework recipes

Contour is a CSS design system plus a layer of **custom elements**. There is no
framework wrapper to install and no adapter to keep in step: the components are
the platform's, so every framework consumes them the same way it consumes any
other HTML element. This page shows the shortest path in each one, plus the one
piece of configuration each framework needs so it does not treat
`<contour-…>` as a typo.

Two rules hold everywhere:

- **Register once.** Importing a web-component bundle registers its elements as
  a side effect. Import `contour-ds/contour-wc.esm.js` for every element, or a
  single family from `contour-ds/wc/<family>.mjs` to keep the bundle smaller.
  Importing the same bundle twice is safe — `customElements.define` is guarded.
- **State travels as attributes and events.** Read and write attributes
  (`label`, `open`, `value`, `rows`, …); listen for `contour:*` events. A
  framework may add sugar on top, but the attribute/event contract is the one
  that always works, and it is the one the type declarations describe.

The examples below are checked by `node tools/check-recipes.mjs`: every
`contour-ds/…` specifier must resolve through the package's `exports` map,
every `<contour-…>` tag must be declared in `dist/custom-elements.json`, and
every `contour:*` event name must appear in that manifest's event vocabulary.

## Install and style

```bash
npm install contour-ds
```

```css
/* every layer, in cascade order */
@import "contour-ds/contour.min.css";

/* or only the surface this product ships */
@import "contour-ds/surfaces/contour-core.min.css";
```

```js
// every custom element
import "contour-ds/contour-wc.esm.js";

// or one family; the tag you use must be in the family you import
import "contour-ds/wc/data.mjs";
```

The CSS bundles expect the self-hosted fonts beside them (`dist/fonts/`), which
the package ships. `hljs.css` and `map-chrome.*.css` are optional companions and
are not part of the main bundle.

## React

React renders a hyphenated tag as a custom element without configuration. Keep
the event listener on the DOM node: `ref` is the contract that does not depend
on React's custom-element event heuristics.

```jsx
import { useEffect, useRef } from "react";
import "contour-ds/contour.min.css";
import "contour-ds/contour-wc.esm.js";

export function LayerSearch({ layers, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e) => onSelect(e.detail);
    el.addEventListener("contour:select", handle);
    return () => el.removeEventListener("contour:select", handle);
  }, [onSelect]);

  return (
    <contour-table
      ref={ref}
      label="Layers"
      rows={JSON.stringify(layers)}
      columns={JSON.stringify(["name", "features"])}
      virtual
    />
  );
}
```

TypeScript: the package ships JSX intrinsics for every tag. Add one reference in
a `.d.ts` your `tsconfig` already includes:

```ts
/// <reference types="contour-ds/react" />
```

Non-string values are properties, not attributes; React sets them on the element
when the component declares them. When in doubt, pass the string form
(`rows={JSON.stringify(rows)}`) — it is what the server sends and what the
attribute contract describes.

## Vue

Vue needs to be told that `contour-*` tags are custom elements, or the compiler
warns and tries to resolve them as components. In Vite:

```js
// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag.startsWith("contour-") },
      },
    }),
  ],
});
```

```vue
<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import "contour-ds/contour.min.css";
import "contour-ds/contour-wc.esm.js";

const emit = defineEmits(["select"]);
const table = ref(null);

const onSelect = (e) => emit("select", e.detail);
onMounted(() => table.value?.addEventListener("contour:select", onSelect));
onBeforeUnmount(() => table.value?.removeEventListener("contour:select", onSelect));
</script>

<template>
  <contour-table
    ref="table"
    label="Layers"
    :rows="JSON.stringify(rows)"
    :columns="JSON.stringify(['name', 'features'])"
    virtual
  />
</template>
```

TypeScript: `contour-ds/vue` augments `GlobalComponents` with every tag, so a
template type-checks once the file is in the program:

```ts
/// <reference types="contour-ds/vue" />
```

## Svelte

Svelte treats a lowercase tag containing a dash as a custom element; no
configuration is needed. Use `bind:this` for the node and add the listener
yourself, exactly as in React and Vue:

```svelte
<script>
  import { onMount } from "svelte";
  import "contour-ds/contour.min.css";
  import "contour-ds/contour-wc.esm.js";

  export let layers = [];
  let table;

  onMount(() => {
    const handle = (e) => console.log(e.detail);
    table.addEventListener("contour:select", handle);
    return () => table.removeEventListener("contour:select", handle);
  });
</script>

<contour-table
  bind:this={table}
  label="Layers"
  rows={JSON.stringify(layers)}
  columns={JSON.stringify(["name", "features"])}
  virtual
/>
```

Svelte passes non-string values to custom elements as properties; the string
form above keeps the markup honest and identical to what the server sends.

## Astro

Astro renders custom elements as static HTML and hydrates nothing by default —
which is what the component layer expects, because every component is usable
without JavaScript. Add a client directive only when the component needs its
enhancement on the client immediately:

```astro
---
import "contour-ds/contour.min.css";
import "contour-ds/contour-wc.esm.js";
const layers = [{ name: "Roads", features: 1204 }];
---

<contour-table
  label="Layers"
  rows={JSON.stringify(layers)}
  columns={JSON.stringify(["name", "features"])}
  virtual
/>
```

`client:load` is not required for the element to render; it is required for the
custom-element upgrade to run on the client *before* the reader interacts.
Astro slots are light-DOM children, which is how Contour composes: a card's
content is the element's own children.

```astro
<contour-card title="Elevation">
  <p>Body content is slotted by being a child, not by a named slot.</p>
</contour-card>
```

## Events and state, without a framework

The pattern every recipe above uses is the smallest one that is true
everywhere:

```js
const el = document.querySelector("contour-table");
el.addEventListener("contour:select", (e) => {
  // e.detail is the component's intent; the host owns the state.
  render(e.detail);
});
el.setAttribute("rows", JSON.stringify(nextRows));
```

Contour components emit intent and reflect host-owned state
(`contour:select`, `contour:input`, `contour:change`, `contour:layer-reorder`,
…). They do not keep a global store, so the host's framework remains the single
source of truth.