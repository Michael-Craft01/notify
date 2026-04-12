## 2024-04-12 - Keyboard Accessibility for Hover Actions
**Learning:** Actions hidden behind `group-hover:opacity-100` become completely inaccessible to keyboard users because they cannot hover to reveal them.
**Action:** Always pair `group-hover:opacity-100` with `focus-within:opacity-100` for containers holding interactive elements, ensuring actions remain visible and usable when keyboard users tab into them.
