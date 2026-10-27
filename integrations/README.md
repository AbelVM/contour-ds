# Integrations

Optional, non-core artifacts that help Contour fit into other toolchains. None
of these are required to use the system; `src/` and `dist/` remain the product.

| Path | What it is |
|---|---|
| `integrations/tailwind/contour-theme.css` | Tailwind v4 `@theme` bridge exposing Contour tokens as utilities |
| `integrations/native/style-dictionary.config.json` | Style Dictionary config emitting Swift / Android / Flutter tokens from the DTCG export |
| `integrations/ai/.cursorrules` | Drop-in rules file for Cursor / Claude Code / similar agents |
| `integrations/ai/v0-prompt.md` | System prompt for v0 / Bolt / Lovable / similar generators |
| `integrations/ai/CLAUDE.md` | Snippet to append to a project's `CLAUDE.md` |

These ship in the npm tarball under `integrations/` (see `package.json` `files`).
