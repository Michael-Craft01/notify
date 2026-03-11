* **Architecture:** Next.js PWA + Supabase (Real-time DB) + Web Push API.
* **Core Innovation:** **"The Pulse"** (Class-wide progress tracking) and **"Synthetic Urgency"** (AI-calculated start times).
* **Aesthetic:** Deep Orange accents on a Dark-Mode/Industrial interface.

---

## 📄 `agent.md`

### 1. Identity & Mission

**Name:** Notify

**Parent Entity:** LogicHQ

**Objective:** To eliminate "Assignment Amnesia" within the Computer Science cohort through crowdsourced intelligence and aggressive notification cycles.

> "Information is useless if it arrives after the deadline. The Warden ensures that no student in the network fails due to a lack of awareness."

---

### 2. Core Functional Requirements

#### A. Crowdsourced Intelligence (The "Wiki" Model)

* **Verified Entry:** Any authenticated student can log an assignment.
* **Validation Layer:** If two or more students "Confirm" the details (Date/Time/Link), the assignment is marked as **Verified** and broadcasted to the entire class.
* **Attachment Scraping:** Integrated OCR to pull deadlines directly from PDF lab manuals or whiteboard photos.

#### B. The Notification Matrix (Web Push API)

* **The T-Minus 48h (The Strategist):** A high-level overview of requirements and estimated "Time-to-Code."
* **The T-Minus 24h (The Reminder):** A firm nudge including the current "Class Completion" percentage.
* **The T-Minus 6h (The Panic Button):** High-priority, persistent notification.

#### C. Progressive Web App (PWA) Capabilities

* **Offline Access:** View the "Doom Clock" (upcoming deadlines) without an active internet connection.
* **Home Screen Integration:** Native-feel icon (Orange/Black) for instant access.
* **Background Sync:** Ensures notifications fire even if the browser tab is closed.

---

### 3. Innovative Enhancements

#### I. The "Pulse" (Social Accountability)

Instead of just a deadline, the app tracks the "Class Vibe."

* **Feature:** A "Start/Finish" toggle for every student.
* **Impact:** Notifications will include: *"74% of your peers have finished 'Data Structures Lab 3'. You are in the bottom 26%. Start now."* This leverages healthy peer pressure to reduce procrastination.

#### II. AI Struggle-Time Estimation

* **Feature:** Uses an LLM to analyze the assignment description (e.g., "Implement a B-Tree in C++").
* **Innovation:** The Warden calculates a **"Difficulty Multiplier."** If the task is a "Level 9," the 48-hour notification is automatically moved to 96 hours to account for the inevitable debugging phase.

#### III. The "LogicHQ" Ecosystem Integration

* **Feature:** Direct link to project resources via your other LogicHQ tools (like `protech.logichq.tech`).

---

### 4. Technical Stack & Implementation

| Layer | Technology | Reason |
| --- | --- | --- |
| **Frontend** | Next.js 14+ (App Router) | SEO, speed, and easy PWA manifest generation. |
| **Styling** | Tailwind CSS | To implement the **Deep Orange** and Slate-Dark theme quickly. |
| **Database** | Supabase | Real-time listeners for when a peer adds a new assignment. |
| **Auth** | NextAuth / Supabase Auth | Restricted to `@university.ac.zw` (or your specific domain). |
| **Push** | Web-Push (VAPID) | Cross-platform (iOS/Android/Chrome) notification delivery. |
| **AI Layer** | **Google Gemma-3-27b-it** | Multimodal analysis (OCR and Difficulty scoring). |

---

### 5. Deployment Logic

1. **Environment:** Vercel for the edge-functions (handling the cron-jobs for notifications).
2. **Service Worker:** A `sw.js` file to handle the `push` events and show notifications even when the device is locked.

---
