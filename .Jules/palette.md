## 2025-03-20 - [ARIA Labels for Icon-Only Buttons]
**Learning:** Found several core UI components (like `AssignmentCard` and `SettingsModal`) that utilized purely icon-based buttons for critical user actions (Edit, Delete, Expand, Open Settings, Close Modal) without `aria-label`s. This makes navigation and understanding difficult for screen readers.
**Action:** When adding or reviewing icon-only buttons, prioritize ensuring that an `aria-label` (and `aria-expanded` / `aria-haspopup` when dealing with toggles or modals) is always present to define the action semantically.
