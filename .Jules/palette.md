## 2024-05-18 - AssignmentCard Accessibility
**Learning:** Icon-only buttons without `aria-label`s fail accessibility tests for screen readers, and interactive elements must have visible focus states (`focus-visible:ring-*`) for keyboard navigability.
**Action:** Always add `aria-label` and `focus-visible` styles to any button containing only an icon. Provide `aria-expanded` attributes on toggle buttons that control expanding sections to ensure correct readout by screen readers.
