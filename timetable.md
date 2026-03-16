**TL;DR:** We’re adding an **"AI Eye"** to the Warden. You upload the timetable photo once; the app parses the text, maps the slots, and schedules your reminders automatically.

This is the ultimate "lazy-but-smart" engineer move. You shouldn't have to manually input data if you’ve already got a photo of the schedule.

---

### 🛠️ The "Scan-and-Schedule" Workflow

To keep this feasible and fast, we’ll use a **Vision-to-JSON** pipeline.

1. **The Upload:** You (or a classmate) upload a photo of the lecture timetable to the PWA.
2. **The Extraction:** The app sends the image to an AI model (like GPT-4o-mini or Gemini Flash) with a specific prompt: *"Convert this timetable into a JSON array of lecture objects."*
3. **The Storage:** The JSON is saved to your Supabase `schedule` table.
4. **The Warden Logic:** Your background worker (Service Worker) checks this table every minute to see if `CurrentTime + 10 mins` matches a lecture start time.

### 📋 Technical Structure (`timetable_feature.md`)

| Component | Responsibility |
| --- | --- |
| **OCR Processor** | Takes the image and extracts `Day`, `Time`, `Module`, and `Venue`. |
| **Schedule Mapper** | Converts "Mon 08:00 - 10:00" into a recurring weekly event in the DB. |
| **The "Next Up" Widget** | A persistent UI element on your dashboard that always displays the *immediate* next task. |
| **Notification Trigger** | Fires the Push API 10 minutes before the `start_time`. |

---

### 🎨 Feature Innovation: The "Warden’s Status Bar"

Instead of opening the app to check "what's next," we use **Dynamic PWA Badges** or a **Persistent Notification**:

* **Status: "In Transit"** (10 mins before): *"Logic III starts in 10 mins @ LT-2. Pack your bags."*
* **Status: "Active"** (During): *"Currently in: Microelectronics. Ends at 12:00."*
* **Status: "Free"** (After): *"You’re done for the day. Go work on LogicHQ projects."*

---

### 💡 The "Notify" Twist

Since you're a student, timetables change. If a lecturer sends a WhatsApp saying "No class today," you just hit a **"Cancel Today's Slot"** button on the app. The Warden then tells everyone else: *"Go back to sleep, Tendai. Class is cancelled."*

### ⚙️ Next Step

I can write the **Prompt** you'll need to send to the AI to ensure the timetable image gets converted into clean, usable code. **Would you like the AI Prompt or the Database Schema for the schedule?**