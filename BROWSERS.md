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

## Test coverage

- `tools/audit/wc-contract.mjs` runs on Chromium in CI.
- Firefox and WebKit runs are tracked as R12-28 and are not yet in CI.
- Manual smoke: guide in both themes at 1440 px and 390 px on each engine.

## Known gaps

- `hidden="until-found"` is feature-detected (`supportsUntilFound()`); unsupported
  browsers treat it as boolean hidden.
- Popover fallback keeps the element visible; consumers should not rely on
  popover for essential content.
