## 2026-04-10 - Pair hover visibility with focus-within
**Learning:** When building interactive UI elements that become visible on hover (like edit/delete actions inside a card), keyboard users cannot access them via tabbing if only `group-hover:opacity-100` is used.
**Action:** Always pair hover-based visibility classes (e.g. `group-hover:opacity-100`) with focus-based visibility classes (e.g. `focus-within:opacity-100`) on the containing element. This ensures actions remain visible and usable for keyboard-only users.
