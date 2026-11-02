# Locale, RTL, and formatting policy — Contour

Contour stays zero-runtime. Locale handling uses the platform `Intl` APIs and
consumer-supplied labels; no locale data is bundled.

## Locale resolution

- Default locale: `navigator.language` (runtime), falling back to `"en"`.
- Components accept a `locale` attribute to override per instance.
- `formatValue(value, format, locale, unit)` (src/js/wc/core.mjs) is the single
  formatting entry point; presets: number, currency, percent, compact, date,
  time, unit, relative. A JSON string of Intl options is also accepted.

## Fallback

- On any `Intl` failure, return the raw value unchanged. Never throw.
- English fallback strings are used only where a label is not supplied by the
  consumer (e.g. time-slider play/pause labels default to "Play"/"Pause").
- Consumers should supply their own labels for production; defaults are
  development conveniences.

## RTL

- Structural support via CSS logical properties (`margin-inline`, `padding-inline`,
  `inset-inline`, etc.) throughout `src/css`.
- Components honour the `dir` attribute on the host and propagate to generated
  content where needed.
- A full RTL audit is pending (see ACCESSIBILITY.md known limitations).

## Long labels / CJK / Arabic

- Text containers use `overflow-wrap: anywhere` / `word-break` where a long
  token could overflow; truncation uses `text-overflow: ellipsis` with a
  `title` tooltip only as a last resort.
- Layout primitives (`.stack`, `.cluster`) wrap rather than clip.
- No fixed widths on text-bearing controls.

## Plurals

- Use `Intl.PluralRules` in consumer code; Contour does not ship plural tables.
- Components that display counts accept a `format`/label template from the
  consumer rather than hard-coding plural forms.

## Date / number conventions

- Dates formatted via `Intl.DateTimeFormat` with the resolved locale.
- Numbers via `Intl.NumberFormat`. Currency defaults to USD only when no
  currency is supplied; consumers should pass `currency` in the format JSON.

## Testing

- Long German/CJK/Arabic labels, RTL, 200% zoom, and 320/390 px examples are
  required for any component with real text risk (see review R12-11).
