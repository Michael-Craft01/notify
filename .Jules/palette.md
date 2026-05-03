
## 2024-05-24 - Focus States on Hover-Revealed Actions
**Learning:** Actions that are revealed on hover using `group-hover:opacity-100` must also include `focus-within:opacity-100` to be accessible to keyboard users. Additionally, using standard `focus-visible:ring-2` styling on these buttons ensures a clear visual indicator when navigating via keyboard.
**Action:** Always check interactive element containers with hover-based visibility for corresponding focus-based visibility classes. Ensure icon-only buttons have descriptive `aria-label` attributes and appropriate state properties like `aria-expanded` when applicable.
