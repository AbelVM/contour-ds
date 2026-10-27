# Contour — snippet for your project's CLAUDE.md

Append this to your project's `CLAUDE.md` (or `AGENTS.md`) so coding agents
use Contour correctly:

```markdown
## UI: Contour design system

This project uses Contour (`contour-ds`) for all UI. Rules:

- Import the stylesheet once at the app root: `@import "contour-ds/contour.min.css";`
- Use Contour classes (`.c-btn`, `.c-card`, `.c-kpi`, …) and tokens
  (`var(--color-primary)`, `var(--space-md)`, `var(--radius-md)`). Never
  hard-code hex colours or px spacing.
- Naming: `.c-<block>`, `.c-<block>__<element>`, `.c-<block>--<variant>`.
- State is never colour alone: pair every hue with a shape, icon, or word.
- Headings are classes (`.c-section-head__title`), not fixed heading tags.
- Depth is lightness, not shadow.
- Charts carry a dash pattern as well as a hue.
- Mono type is for data, labels, code — never body copy.
- Full contract: `node_modules/contour-ds/dist/agent-rules.json`.
- Component inventory: `node_modules/contour-ds/dist/contour.components.json`.
- Tokens: `node_modules/contour-ds/dist/contour.tokens.json`.
```
