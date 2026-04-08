## 2025-04-02 - Keyboard accessibility for hover containers
**Learning:** Containers relying on `group-hover:opacity-100` to show actions become inaccessible to keyboard-only users who cannot trigger the hover state.
**Action:** Always pair `group-hover:opacity-100` with `focus-within:opacity-100` (or similar focus-based visibility classes) to ensure interactive child elements become visible when tabbed into.
