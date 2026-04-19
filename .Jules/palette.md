## 2024-04-19 - [AssignmentCard Accessibility]
**Learning:** Hover-based action containers must include `focus-within:opacity-100` alongside hover-based visibility classes (like `group-hover:opacity-100`) so they become visible when keyboard users tab into them.
**Action:** When creating or modifying components with interactive elements hidden behind hover states, always implement focus-within visibility. Additionally, ensure icon-only buttons have descriptive `aria-label` attributes and clear `focus-visible` styling.
