# Web components

Section `webcomponents` — marker `23`, position 24 of 26 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

Detailed interactive stories, controls, keyboard paths and workflow demonstrations live in the optional Storybook workshop (npm run storybook). This section keeps the concise contract, reactivity, events, slots/parts and ownership boundary; Storybook links back to it and does not redefine it.

Open the local Storybook workshop after npm run build, or start it with npm run storybook. The complete registered-element catalogue is in Registered elements; focused interaction stories include forms, charts, overlays and dashboard workflows.

Optional progressive enhancement. Load contour-wc.js after ds.css to use contour-* and contour-shadow-* custom elements that generate their scaffolding from attributes. Light-DOM elements use the cascade directly; shadow-DOM elements ship slots and adopted stylesheets for encapsulation.

Where each shape of the markup lives: §04–§22 show every block as the CSS an author writes by hand, and this section shows the same blocks as elements that generate it. The division is deliberate, not a migration left half-done. The raw markup is the contract a consumer copies, and it works with no script at all; this layer is the optional enhancement over that same contract, so a page can drop it and lose nothing but its attributes.

Reactivity: every component extends ContourBase, which snapshots the author's nodes and class on first connect. An attribute change restores that snapshot, re-runs render(), and re-wires behaviour via enhance(), so authored content and listeners survive while generated nodes are rebuilt. Form values are preserved across a re-render; render bodies use ensure() for update-or-create reactivity.

Composition: components never reach into one another. A host composes by nesting or slotted content, and interactive components emit a published vocabulary of bubbling contour:* CustomEvents — every name, its payload keys and its composed flag are the event table below — that a parent handles without coupling to internals. Shadow wrappers adopt the document's same-origin sheets once and share one parsed stylesheet across instances.

Shadow layer parity: the contour-shadow-* wrappers are a styling shell. They adopt the document's sheets and wire a small set of behaviours (tabs, segmented, combobox, tree, menu, pagination, copy, removable); the remaining wrappers provide ARIA setup only. Shadow tabs and code-tabs use a slot template and expect authored panels, unlike the light-DOM tabs which generate panels from the tabs attribute. Consumers who need full widget behaviour should use the light-DOM contour-* elements.

Async-state contract: 60 components expose loading, error, empty, retry and skeleton attributes, rendered through the shared wireStates / renderStates helpers in src/js/wc/states.mjs. A component that reads one of these attributes but does not call wireStates is a bug.

Property reflection: every component declares a properties map (name → { attribute, type }), and ContourBase installs accessors so el.value = 42 writes the attribute and triggers the normal re-render path. Types are String (default), Number and Boolean; a null/false value removes the attribute. Components that observe an attribute but omit it from properties are not reflectable — the wc-contract gate flags the gap.

Mutation and events: attributes are the public input; a consumer mutates them directly (el.setAttribute("variant", "danger") or the reflected property) and the component re-renders. Interactive components emit the bubbling contour:* events in the table above with composed: true, so a parent — including one inside a shadow root — handles them without coupling to internals. Form controls use ElementInternals and emit contour:input / contour:change with { name, value, checked }.

Slots and parts: the contour-shadow-* wrappers adopt the document's sheets and expose ::part() hooks for the named regions in their templates; slotted content is preserved across re-render because the base class snapshots authored nodes. Loading, error, empty and skeleton states are rendered through the shared wireStates / renderStates helpers, so a component that reads one of those attributes without calling wireStates is a bug.

Token-name compatibility: consumers migrating from libreship may keep their --ls-* names by aliasing them onto the corresponding --color-* / --chart-* tokens on :root; the system publishes only the Contour names.

The same table contract composes inside a stack, while an error boundary keeps a fallback local to the failed widget.

Every contour:* event the layer dispatches, the payload keys an emission site can carry, and the composed flag. Payload keys are the union of keys the emission sites pass; an empty payload is an event that carries no detail object. Composition here is what the flag is for: a component hosted inside another author's shadow root still surfaces its events to the document, and a consumer reads the same frozen list from window.ContourEvents.

Per-element reference generated from contour.components.json: host-set inputs, sheet-defaulted vars, variants, element count and token count. Regenerate with node tools/gen-api-cards.mjs.

One card, two ways to change it. Writing three attributes in turn rebuilds the card three times; the same three writes inside batch() rebuild it once. The count is the element's own renderCount, not a number this page keeps, so it cannot drift from what the layer did.

Concise usage notes for the web-component layer. The generated API cards above cover structural inputs (observed attributes, properties, parts); these notes cover intent, composition and gotchas the cards cannot express. Full text: tmp/dx_notes.md.

Toggle attributes live and watch the component re-render. The alert's variant and the kpi's value are driven by the controls below; no page-level state is kept.

contour-input, contour-select, contour-check and contour-switch participate in a native form via ElementInternals: their values are submitted, validated and reset like native controls. Submit the form below to see the FormData it produces.

Interactive components emit bubbling contour:* CustomEvents on the host, so a parent handles them without coupling to internals. The menu below emits contour:select; the pagination emits contour:page.

Authored content survives re-renders.

Slotted content in the shadow root.

Dialog body content.

Dialog body content.

Dialog body content.

Content behind the scrim.

## Subsections

- Composition and states
- Event vocabulary
- Component API reference
- Reactivity, counted
- DX notes (per component)
- Reactivity playground
- Form association
- Event emission

## Blocks documented here

23 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-btn`
- `.c-card`
- `.c-cluster`
- `.c-disclosure`
- `.c-geocoder`
- `.c-icon-badge`
- `.c-kbd`
- `.c-link`
- `.c-panel`
- `.c-price`
- `.c-range`
- `.c-scrim`
- `.c-section-head`
- `.c-select`
- `.c-shortcut`
- `.c-shortcut-list`
- `.c-shortcut-overlay`
- `.c-shortcut-panel`
- `.c-shortcut-row`
- `.c-spatial-filter`
- `.c-stack`
- `.c-table`
- `.c-table-wrap`

---

Source `index.html` @ `89164adf826b1812` · last committed 2026-11-03T18:38:35+01:00 · no URL: the project is private until v1.0.
