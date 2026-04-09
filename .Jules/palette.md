
## 2024-11-20 - Keyboard Accessibility for Hover-Revealed UI Elements
**Learning:** Hover-revealed elements (like `opacity-0 group-hover:opacity-100` containers for edit/delete actions) hide interactive elements from keyboard-only users because they never receive the hover state needed to become visible.
**Action:** Always include `focus-within:opacity-100` (or similar focus-based visibility classes) alongside hover-based visibility classes for containers with interactive elements. This ensures the actions become visible and usable when a user tabs into them.
