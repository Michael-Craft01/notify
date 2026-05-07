## 2024-05-07 - Focus-Within for Hidden Actions
**Learning:** Icon-only action buttons (like Edit/Delete) that are visually hidden until hovered (`group-hover:opacity-100`) are completely inaccessible to keyboard users because they cannot hover.
**Action:** Always pair `group-hover:opacity-100` with `focus-within:opacity-100` on the container so that hidden actions become visible when a user tabs into them.
