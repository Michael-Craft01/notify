## 2024-04-11 - Hover-Revealed Container Accessibility
**Learning:** Containers that reveal icon-only buttons on hover (e.g., `opacity-0 group-hover:opacity-100`) often lack `focus-within:opacity-100`. This hides actions from keyboard users when they tab into the container. Icon-only actions in these containers also frequently lack `aria-label`s.
**Action:** When adding hover-based visibility, always pair it with `focus-within` visibility for keyboard access. Ensure all icon-only buttons have descriptive `aria-label` and `title` attributes.
