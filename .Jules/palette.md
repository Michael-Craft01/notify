
## 2024-10-25 - Icon-only buttons accessibility and keyboard focus patterns
**Learning:** Found a recurring pattern of icon-only buttons missing `aria-label`s across several components, reducing screen reader utility. Additionally, interactive actions contained within hover-based utility classes (e.g., `group-hover:opacity-100`) were invisible to keyboard users.
**Action:** Always provide descriptive `aria-label` attributes on icon-only buttons (like Edit, Delete, Close, and Expand/Collapse icons). Moreover, whenever `group-hover` is used to reveal actions, consistently pair it with `focus-within:opacity-100` so that users navigating via the Tab key can access and view these elements.
