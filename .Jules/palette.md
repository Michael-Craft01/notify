## 2024-04-24 - Action button visibility for keyboard users
**Learning:** Container actions revealed via `group-hover:opacity-100` are completely hidden from keyboard-only users navigating via tab.
**Action:** Always pair `group-hover:opacity-100` with `focus-within:opacity-100` on the container, and ensure interactive elements inside have `focus-visible` styles to ensure keyboard accessibility.
