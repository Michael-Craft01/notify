## 2025-02-12 - Icon-Only Button Accessibility Pattern
**Learning:** Found a pattern in `AssignmentCard.tsx` where icon-only action buttons (Edit, Delete, Expand Details) lacked `aria-label` and `focus-visible` ring indicators, reducing accessibility for screen readers and keyboard users.
**Action:** Add `aria-label` descriptors and `focus-visible:ring-2` to all icon-only buttons to ensure they are screen-reader friendly and clearly indicate focus for keyboard navigation.
