## 2024-05-15 - Keyboard Accessibility with Hover-Based Visibility Containers
**Learning:** Utilizing hover-based visibility classes (e.g., `group-hover:opacity-100`) on interactive element containers hides those actions from keyboard-only users who cannot hover to reveal them before tabbing.
**Action:** When using hover-based visibility classes on containers with interactive items, always include a corresponding focus-within class (e.g., `focus-within:opacity-100`) to ensure they become visible and usable when navigated via keyboard.
