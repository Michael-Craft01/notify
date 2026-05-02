## 2024-05-02 - Ensure Interactive Elements in Hover Containers Remain Accessible
**Learning:** Relying solely on `group-hover:opacity-100` for action menus hides them from keyboard-only users navigating via tab. Icon-only buttons frequently lack `aria-label`s, and expandable sections lack `aria-expanded` attributes in this app.
**Action:** Always include `focus-within:opacity-100` alongside hover classes for interactive element containers. Add `aria-label` to icon-only buttons and `aria-expanded` to toggle buttons.
