## 2025-04-04 - Keyboard Accessible Hover Actions
**Learning:** Containers that show action buttons on hover (`opacity-0 group-hover:opacity-100`) completely hide those interactive elements from keyboard-only users.
**Action:** Always pair hover-based visibility classes with `focus-within:opacity-100` so actions reveal themselves when a user tabs into the hidden buttons.
