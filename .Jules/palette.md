## 2024-05-18 - Keyboard accessibility on hover-revealed containers
**Learning:** Containers with interactive elements that are revealed on hover (`group-hover:opacity-100`) often remain hidden to keyboard-only users navigating via tab.
**Action:** Always include `focus-within:opacity-100` alongside hover classes to ensure interactive actions are visible when tabbed into.
