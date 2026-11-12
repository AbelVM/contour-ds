# Browser compatibility matrix — Contour

Supported engines: latest two stable releases of Chromium, Firefox, and WebKit
(Safari). Older browsers receive the CSS fallback (`light-dark-fallback.css`)
and degrade gracefully (no custom elements upgrade, native controls remain).

## Feature matrix

| Feature | Chromium | Firefox | WebKit | Fallback |
|---|---|---|---|---|
| Custom Elements v1 | yes | yes | yes | unknown tag, native markup stays |
| ElementInternals / formAssociated | yes | yes | yes (17.4+) | host reports no form value |
| Popover API | yes | yes (125+) | yes (17.4+) | element stays visible; CSS gates on `:popover-open` |
| `<dialog>` showModal | yes | yes | yes | native dialog without modal backdrop |
| Adopted stylesheets (shadow layer) | yes | yes | yes | shadow layer unavailable; light DOM only |
| `light-dark()` | yes (123+) | yes (120+) | yes (17.5+) | `light-dark-fallback.css` |
| Anchor positioning | yes (125+) | partial | partial | absolute fallback |
| `hidden="until-found"` | yes | no | no | boolean hidden (content hidden) |
| `content-visibility: auto` | yes | yes | yes (18+) | ignored; full render |
| `:has()` | yes | yes | yes | ignored |
| `@scope` | yes (118+) | yes (128+) | yes (17.4+) | **no flat fallback** — the four scoped blocks (`.c-card`, `.c-toc`, `.c-callout`, `.c-file-tree`) lose their element rules; the block still renders, unstyled |
| Container queries (`@container`) | yes (105+) | yes (110+) | yes (16+) | ignored; the component renders at its default (wide) layout |
| Same-document View Transitions | yes (111+) | no | yes (18+) | plain swap; the tab panel changes without a cross-fade |
| `:state()` (custom states) | yes | yes (126+) | yes (17.4+) | the custom state does not match; the styled state is absent |

## Test coverage

- `tools/audit/wc-contract.mjs` runs on Chromium in CI.
- `tools/audit/contrast-and-aria-cross-browser.mjs` runs the contrast and
  document-hygiene contract on Chromium, Firefox and WebKit, and is wired into
  `tools/doctor.mjs` (`contrast-cross-browser`).
- Manual smoke: guide in both themes at 1440 px and 390 px on each engine.

## Known gaps

- `hidden="until-found"` is feature-detected (`supportsUntilFound()`); unsupported
  browsers treat it as boolean hidden.
- Popover fallback keeps the element visible; consumers should not rely on
  popover for essential content.
