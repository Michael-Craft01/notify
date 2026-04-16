## 2023-10-27 - Action Visibility for Keyboard Users
**Learning:** Actions revealed only via `group-hover` in interactive containers (like `AssignmentCard`) become completely inaccessible to keyboard-only users who cannot hover.
**Action:** Always pair `group-hover:opacity-100` with `focus-within:opacity-100` to ensure inner actions become visible and usable when their parent container or the actions themselves receive focus.
