# Interaction component policy — Contour

Shared policy for interaction components (pressable, row-action, search-trigger,
shortcut*, resize-handle, resizable, draggable, drag-handle, drop-indicator,
drop-zone, scroll-area, table-wrap, segmented).

## Pointer / keyboard parity

- Every pointer action has a keyboard equivalent.
- Drag/reorder: arrow keys move, Enter/Space grab/drop, Escape cancel.
- Resize: arrow keys resize by a step; Shift for larger step.
- Drop zones announce accept/reject/clear via `contour:drop` and live region.

## Touch

- Pointer targets ≥ 24 px (44 px preferred on coarse pointers).
- No hover-only essential information.
- Drag has a non-gesture alternative (keyboard or button).

## Cancellation and capture

- Pointer capture loss cancels the operation and restores state.
- `pointercancel` / `lostpointercapture` handled.
- Scroll containers do not steal drag gestures unexpectedly.

## Announcements

- Reorder emits `contour:move` / `contour:reorder` with from/to.
- Drop emits `contour:drop` with value/label.
- Resize emits `contour:drag` with delta/value.

## Testing

- Pointer, keyboard, touch, cancellation, capture loss, scroll containers
  (R12-10).
