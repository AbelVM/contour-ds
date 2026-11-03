# Documentation

Section `docs` — marker `15`, position 16 of 26 in the guide.
Generated from `index.html`; prose quoted, counts from the inventory, no URL (the project is
private until v1.0). See `index.json` for the whole set and the shared statement.

## What the guide says

The parts that make a manual usable: a callout that holds a rule, a list of steps that holds an order, a diff that holds a change, and a pager that holds the way out.

Equivalent contour-* elements are catalogued in §23.

Five tones. Each carries an icon and a word, so the meaning survives a monochrome print and a reader who cannot tell red from green.

Note

Tile URLs are parsed once and cached for the rest of the session.

Tip

Pre-warm the tile cache before the first query for the fastest start.

Caution

Avoid routing on a carriageway — the graph has no turn restrictions there.

Unsupported

Isoline extraction needs a time-based weight; other costs cannot be contoured.

New in 1.0

Delta-stepping is now the default engine for weighted graphs — 4× faster than the previous selector, with the same results.

The clearest way to teach a convention is to show both outcomes, side by side.

Do

Name the axis a number is measured on. 7 ms median is a fact; 7 is a rumour.

Don't

Drop the unit or the comparison period. A delta without a baseline cannot be argued with.

A numbered procedure. The number is a waypoint, not an ornament — the rule and the connector between numbers both say the order is not optional.

Any vector tileset with a routable profile works. Contour reads the standard schema, so there is nothing to pre-process.

Give it a start and an end. The default radius of 50 m covers most addresses; raise it only for rural geometry.

You get geometry, cost and the engine that produced them — enough to draw the line and to explain the number beside it.

One snippet, three package managers. The choice is remembered per group, so a reader who prefers pnpm is not nagged on every page.

A single command with a copy button — the most-used component on any documentation site.

ESM only, 42 kB gzipped, no peer dependencies beyond MapLibre.

For changelogs and migration guides. The removed line and its replacement sit on adjacent rows, so the eye can compare them without counting.

A version picker in the header, and a banner when the reader is on an old one.

A project tree in a code panel, with the file under the cursor marked.

Contour ships no syntax highlighter (zero runtime dependencies); highlighting is the consumer's. src/css/hljs.css maps highlight.js token classes onto Contour tokens, so a consumer who runs that highlighter gets code that matches the system's palette in both themes. It sets colour only — never layout, never font-family. Load it after the library's own stylesheet.

The way out of a long page, at the foot of it. Both links are real links, so they survive a right-click and a middle click.

## Subsections

- Web component counterpart
- Callouts
- Do / Don't
- Steps
- Code tabs
- Install
- Diff
- Versions
- File tree
- Pager
- Web component counterpart

## Blocks documented here

14 block(s). Their facts live in `../contour.components.json`;
only the names are here, because the same figure in two files is how a document
starts disagreeing with itself.

- `.c-btn`
- `.c-callout`
- `.c-code-tabs`
- `.c-diff`
- `.c-do-dont`
- `.c-file-tree`
- `.c-icon-badge`
- `.c-install`
- `.c-kbd`
- `.c-pager`
- `.c-section-head`
- `.c-steps`
- `.c-version`
- `.c-version-banner`

---

Source `index.html` @ `89164adf826b1812` · last committed 2026-11-03T18:38:35+01:00 · no URL: the project is private until v1.0.
