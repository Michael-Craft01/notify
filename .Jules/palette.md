## 2026-04-17 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** The project relies heavily on icon-only buttons for various UI components (e.g. settings modal, close modal buttons, task edit/delete buttons, chat toggle). These buttons currently lack `aria-label`s, which is a major accessibility issue for screen reader users.
**Action:** Consistently add descriptive `aria-label` attributes to all icon-only buttons across the application components.
