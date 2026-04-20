## 2026-04-20 - Interactive Element Accessibility Pattern
**Learning:** Action buttons in containers that are hidden by default (e.g., `opacity-0 group-hover:opacity-100`) become inaccessible to keyboard users because they cannot see the elements they tab to. Additionally, icon-only buttons require explicit screen reader text and visual tooltips.
**Action:** Always include `focus-within:opacity-100` alongside `group-hover:opacity-100` for containers with interactive elements. Ensure all icon-only buttons have `aria-label` and `title` attributes.
