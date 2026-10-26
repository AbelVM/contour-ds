# Templates

Three starter pages, one per surface. They are complete, working pages — open
one and it runs.

| Template | Surface | What it shows |
|---|---|---|
| `landing.html` | Marketing | Hero split, install block, metrics band, features, pricing, testimonial, FAQ, CTA band |
| `documentation.html` | Documentation | Nav tree, breadcrumb, prose, code tabs, install, code block, callout, options table, pager, on-this-page |
| `dashboard.html` | Dashboard | Toolbar, filter pills, KPI row, chart panels with a dash-pattern series, dense sortable table |
| `vite/` | Vite + React | Minimal Vite app importing Contour from a local checkout |
| `astro/` | Astro | Minimal Astro site with the stylesheet wired into the base layout |

## Running them

They live in the repository, so they load the system from `../src/css/ds.css`:

```bash
python3 -m http.server 8899 --directory /data/projects/DS
# then open
# http://localhost:8899/templates/landing.html
```

A file:// open works too — there is no module or fetch dependency.

## Using them in a project

Copy the file, delete what you do not need, and point the stylesheet at your
own build:

```html
<link rel="stylesheet" href="/css/contour.css" />
```

If you have run `node tools/build.mjs`, `dist/` holds the bundled stylesheet
and script — point the template at those instead:

```html
<link rel="stylesheet" href="../contour.css" />
<script src="../contour.js" defer></script>
```

The build produces the design system only, so the templates are not copied
into it.

## What is deliberately left out

- **The icon sprite.** Each template carries a small inline sprite with only
  the icons it uses. A real project would have a build step that emits one
  sprite for the whole product.
- **The fonts.** They are self-hosted through `src/css/ds.css` (which pulls in
  `src/css/fonts.css`), so the templates look right with no third-party request.
  Copy `src/css/fonts/` along with the stylesheet if you relocate the build.
- **Content.** Every number, name and quotation is a placeholder.

## Rules to keep

The templates are ordinary Contour usage, so the accessibility contract
applies to them as much as to the guide:

- One `main`, one `h1`, headings in order.
- Every icon-only control has an `aria-label`.
- State is never carried by colour alone.
- The page works with JavaScript disabled.
