## 2026-04-26 - [Assignment Card Accessibility]
**Learning:** Icon-only action buttons hidden behind hover states become inaccessible to keyboard users unless `focus-within:opacity-100` is added alongside `group-hover:opacity-100`. Furthermore, standard toggle buttons often lack `aria-expanded` state indicators for screen readers.
**Action:** When adding hover-based action menus to cards, always include `focus-within` visibility classes and bind `aria-expanded` to expand/collapse toggle states.
