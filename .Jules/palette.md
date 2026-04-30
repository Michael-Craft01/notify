## 2026-04-30 - [Hover-revealed interactive elements accessibility]
**Learning:** Elements that are revealed only on hover (`opacity-0 group-hover:opacity-100`) remain invisible to keyboard-only users who tab to them, hiding important functionality (like edit/delete actions) from screen reader and keyboard users.
**Action:** Always pair hover-based visibility classes (e.g., `group-hover:opacity-100`) with focus-based visibility classes (e.g., `focus-within:opacity-100`) on the parent container to ensure interactive elements become visible and accessible when focused via keyboard.
