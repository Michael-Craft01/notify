## 2024-05-17 - Keyboard Accessibility for Hover Actions
**Learning:** When using `group-hover:opacity-100` to show actions on hover, keyboard users cannot see the actions when tabbing to them unless `focus-within:opacity-100` is also applied to the container.
**Action:** Always pair `group-hover:opacity-100` with `focus-within:opacity-100` on containers holding interactive elements, and ensure inner buttons have `focus-visible` styles.
