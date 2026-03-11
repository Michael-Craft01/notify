## TL;DR

* **Frontend:** Next.js 14+ (App Router) with Tailwind CSS.
* **Backend/Database:** Supabase (PostgreSQL + Real-time).
* **Notification Engine:** Web Push API (VAPID) + Trigger.dev for CRON jobs.
* **Deployment:** Vercel (Edge Functions for low-latency notifications).

---

## 🛠️ Tech Stack & Tools Documentation (`techstack.md`)

This document outlines the professional architectural choices for the **Deadline Warden** PWA, optimized for the **LogicHQ** ecosystem.

### 1. Frontend Framework: Next.js 14+

* **Why:** Provides Server Components for speed and built-in API routes to handle notification triggers without a separate Node.js server.
* **PWA Integration:** Utilizes `@ducanh2912/next-pwa` for seamless service worker registration and `manifest.json` management.
* **Styling:** **Tailwind CSS**.
* *Theme:* Dark Mode by default.
* *Accents:* `orange-600` (`#EA580C`) and `orange-500` for primary actions.



### 2. Backend & State: Supabase

* **Database:** PostgreSQL. Handles assignment data and user subscription tokens.
* **Real-time:** Uses Postgres Changes to instantly update the "Doom Clock" when a peer logs a new assignment.
* **Auth:** Supabase Auth (OAuth/Email). Restricted via **RLS (Row Level Security)** to ensure only verified students can modify data.

### 3. Notification Engine: Web Push & VAPID

* **Standard:** **Web Push Protocol**. This is crucial for PWA functionality on iOS (16.4+) and Android.
* **VAPID Keys:** Secure public/private key pair used to identify your server to the push service (Firebase Cloud Messaging or Apple Push Notification service).
* **Scheduling:** **Trigger.dev**.
* *Reason:* Standard Vercel Cron jobs have a 10-second timeout on the free tier. Trigger.dev allows for long-running "Wait" states (e.g., wait until 48 hours before `due_date`).



### 4. AI & Automation Tools

* **OCR/Extraction:** **Google Cloud Vision API** or **OpenAI gpt-4o-mini**.
* *Use Case:* Extracts `course_code` and `deadline_date` from uploaded images of lab manuals.


* **Sentiment/Difficulty Engine:** **Groq (Llama 3)**.
* *Use Case:* Lightning-fast inference to categorize assignment difficulty and set the "Struggle Time" multiplier.



---

## 🔧 Developer Tooling

| Category | Tool | Implementation Purpose |
| --- | --- | --- |
| **Package Manager** | `pnpm` | Faster, disk-efficient installs compared to `npm`. |
| **State Management** | `Zustand` | Lightweight global state for "The Pulse" progress tracking. |
| **Forms** | `React Hook Form` + `Zod` | Strict validation for assignment entry (prevents bad data). |
| **Testing** | `Playwright` | Specifically to test Service Worker behavior and offline caching. |
| **Icons** | `Lucide React` | Consistent, minimalist iconography. |

---

## 📐 Implementation Architecture

1. **Client-Side:** The browser asks for permission → Generates a **Subscription Object**.
2. **Server-Side:** Subscription is stored in **Supabase** linked to the user's ID.
3. **Cron-Side:** Every hour, a script checks for assignments due in exactly 48, 24, or 6 hours.
4. **Delivery:** The server sends a payload to the **Web Push Endpoint**, which the browser's **Service Worker** catches and displays as a system notification.

---