# Contributing to Contour

Thanks for your interest. Contour is a token-driven design system for spatial
interfaces; the style guide (`index.html`) is both the specification and the
test suite.

## Before you start

- Read `AGENTS.md` — it contains the rules that exist because something went
  wrong once.
- Read `.impeccable.md` for design context (audience, tone, colour strategy,
  anti-goals) before changing anything visual.

## Development

```bash
npm install
node tools/build.mjs          # build dist/
node tools/doctor.mjs         # run all quality gates
npx html-validate index.html templates/*.html
```

## Rules that will bite you

- Anything guide-only belongs in `assets/`, never `src/`. A consumer takes
  `src/` and nothing else.
- Never hand-edit a snippet or a `.ds-example` — run `node tools/snippets.mjs`.
- No raw hex in components; use tokens.
- Run `node tools/snippets.mjs` after editing any specimen, and
  `node tools/build.mjs` after touching `src/`.

## Pull requests

- One concern per PR.
- Include the gate output (`node tools/doctor.mjs`) in the PR description.
- New components must appear in the style guide with a snippet disclosure.
- Breaking changes go in `CHANGELOG.md` under a `### Removed` / `### Changed`
  heading.

## Reporting issues

Use the issue templates. Include the browser, theme (light/dark), and a
minimal reproduction.
