## 2024-05-24 - AssignmentCard Accessibility Pattern
**Learning:** Hover-based button visibility (like `group-hover:opacity-100` for edit/delete) traps keyboard-only users who tab to invisible buttons. Interactive icon-only buttons often lack explicit accessible names.
**Action:** Always pair `group-hover:opacity-100` with `focus-within:opacity-100` on the container, and systematically add `aria-label` to icon-only buttons like edit/delete.
