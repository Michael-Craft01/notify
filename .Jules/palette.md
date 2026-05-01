## 2024-05-01 - Focus Visible Styles for Keyboard Navigation
**Learning:** Found that hover styles (`group-hover:opacity-100`) often hide functionality from keyboard users. The `focus-within:opacity-100` utility is a clean and reliable way to expose hidden action groups (like edit/delete containers) when elements inside them receive keyboard focus.
**Action:** Always pair hover-based visibility patterns with `focus-within` equivalents to ensure actions aren't trapped in invisible UI states for keyboard-only users.
