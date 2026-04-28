## 2024-04-28 - AssignmentCard Keyboard Accessibility Enhancement
**Learning:** Found that hover-only actions (like Edit/Delete buttons in AssignmentCard) using `opacity-0 group-hover:opacity-100` are completely hidden from keyboard users tabbing through the interface, and icon-only buttons lacked semantic labels and proper toggle state ARIA tags.
**Action:** Always include `focus-within:opacity-100` alongside hover classes for interactive element containers. Add `aria-label` to all icon-only buttons and `aria-expanded` to state toggles to maintain a robust accessible UI.
