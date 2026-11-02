# Form component policy — Contour

Shared policy for form-associated components (field, input, textarea, select,
number-field, range, range-scale, date-range, date-picker, time-picker,
color-picker, combobox, version, input-group, switch, check, radio, segmented,
stepper, rating, tags-input, file-upload).

## Form association

- All form components are `formAssociated` and use `ElementInternals`.
- `_syncFormValue()` is the single value writer; `_syncValidity()` the single
  validity writer; `_setCustomState()` mirrors validity to `:state(data-invalid)`.
- Reset/restore/disabled callbacks implemented on ContourBase.

## Required behaviors

- Disabled propagation via `formDisabledCallback` + fieldset.
- Required/invalid/custom validity with `valueMissing`.
- Name/value/FormData behavior; inner controls detached (`form=""`) to avoid
  double submission.
- Reset restores authored defaults, not preserved typed values.
- bfcache restore via `formStateRestoreCallback`.

## Keyboard / input

- IME composition must not commit prematurely.
- Paste, autofill, autocomplete supported via native controls.
- Calendar/date/color pickers: keyboard grid (arrows, Home/End, PageUp/PageDown),
  Enter to commit, Escape to cancel.
- Combobox: arrow nav, Enter to commit, Escape to close, typeahead.
- Tags-input: duplicate rejection, invalid-token handling, paste split, deletion.
- Rating: keyboard + half-step policy.
- Radio/segmented groups: arrow-key wrapping, name/group ownership.

## Locale / RTL

- Date/number formatting via `formatValue` (LOCALE.md).
- RTL via logical properties; calendar grids mirror.

## Mobile

- Native input strategy for date/time/color on coarse pointers where possible.

## Testing

- Each component tested for keyboard, IME, autofill, validity, reset, disabled,
  mobile, locale, calendar/color semantics (R12-09).
