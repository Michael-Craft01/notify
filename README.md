* **Project:** LHQ Deadline Warden (v2.0)
* **Tagline:** The "Academic OS" for CS students.
* **Core Tech:** Next.js, Supabase, Gemini 2.5 Flash (Vision), Web Push API.
* **Key Feature:** AI-powered timetable extraction from photos.

---

# 🛡️ LHQ Deadline Warden
**The Central Intelligence Hub for the CS Cohort.**

The **Deadline Warden** is a high-performance Progressive Web App (PWA) designed to eliminate academic friction. Built under the **LogicHQ** ecosystem, it transforms the "messy student experience" into a structured, automated, and social productivity flow.

---

## ✨ Core Features

### 1. 👁️ AI Vision Timetable (V2 Upgrade)
Stop asking "Where are we going next?" 
* **The Flow:** Take a photo of the lecture timetable → Upload → **Gemini 2.5 Flash** parses the image into a digital schedule.
* **Result:** Instant, recurring reminders 10 minutes before every lecture.

### 2. 📢 Crowdsourced Assignment Tracking
A community-driven wiki for deadlines.
* **Verified Entry:** When a student logs an assignment, it's broadcasted to the class.
* **The Pulse:** Real-time completion tracking. See what percentage of your peers have finished the task.

### 3. 🔔 The Notification Matrix
A relentless reminder system that adapts to your proximity to a deadline:
* **The Strategist (T-48h):** Overview of the task and AI-estimated difficulty.
* **The Nudge (T-24h):** Firm reminder with class progress stats.
* **The Panic Button (T-6h):** High-priority notification for those living on the edge.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | **Next.js 14+** (App Router) + **Tailwind CSS** |
| **Backend** | **Supabase** (PostgreSQL, Real-time, Auth) |
| **AI Engine** | **Gemini 2.5 Flash** (Multimodal Vision to JSON) |
| **Push Engine** | **Web Push API** (VAPID) + **Trigger.dev** |
| **Theme** | **LogicHQ Deep Orange** & Slate Dark Mode |

---

## 📐 System Architecture

### 1. Image Processing Pipeline
1. **User** uploads `timetable.jpg`.
2. **Serverless Function** sends a Base64 stream to the Gemini API.
3. **Gemini** returns a structured JSON:
   ```json
   {
     "module": "Data Structures",
     "day": "Tuesday",
     "start": "14:00",
     "venue": "Lab 4"
   }
   ```
4. **Supabase** stores the recurring schedule for the entire cohort.

### 2. Notification Logic
A CRON job runs every 10 minutes, checking the delta between `CurrentTime` and `LectureStartTime`. If $\Delta t \leq 10\text{ min}$, a push payload is dispatched to all registered Service Workers.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v20+
* Supabase Project URL & Anon Key
* Google AI Studio API Key (for Gemini)

### Installation
1. **Clone the repo:**
   ```bash
   git clone https://github.com/logichq/deadline-warden.git
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Setup Environment Variables:**
   Create a `.env.local` with your Supabase and Gemini keys.
4. **Run Development:**
   ```bash
   pnpm dev
   ```

---

## 🎨 Design Language
* **Primary Color:** `#EA580C` (LogicHQ Deep Orange)
* **Surface:** `#0F172A` (Slate 900)
* **Typography:** Inter / JetBrains Mono (for that "Engineer" feel)

---

## 🛡️ The Warden's Oath
> "I shall not let a student miss a lab. I shall not remain silent while a deadline approaches. I am the guardian of your GPA."

---

**Developed by Michael-Ragu** *Bridging the gap between messy schedules and 1st Class honors.*
