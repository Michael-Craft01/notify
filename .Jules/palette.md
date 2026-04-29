## 2024-10-24 - [Keyboard Accessibility for Action Buttons]
**Learning:** Container components that reveal action buttons on `group-hover` create a hidden focus trap for keyboard users if they tab into them while not hovering.
**Action:** Always include `focus-within:opacity-100` alongside `group-hover:opacity-100` (or similar visibility classes) to ensure actions remain visible and usable for keyboard-only users tabbing into them.
