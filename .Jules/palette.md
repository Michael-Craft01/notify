## 2024-04-06 - Keyboard accessibility on hover-revealed actions
**Learning:** Actions revealed only via `group-hover:opacity-100` are invisible to keyboard users who tab into them.
**Action:** Always add `focus-within:opacity-100` alongside hover-based visibility classes on containers with interactive elements to ensure they appear when focused via keyboard.
