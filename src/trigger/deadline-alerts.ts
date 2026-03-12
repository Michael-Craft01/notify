import { task, wait } from "@trigger.dev/sdk/v3";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Setup Web Push
webpush.setVapidDetails(
    "mailto:admin@notifyapp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// Setup Supabase (Service Role for backend access)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.DATABASE_ANON_KEY! // Use service role if possible for background jobs
);

interface DeadlinePayload {
    assignmentId: string;
    dueDate: string;
    title: string;
}

export const scheduleDeadlineAlerts = task({
    id: "schedule-deadline-alerts",
    run: async (payload: DeadlinePayload) => {
        const { assignmentId, dueDate, title } = payload;
        const dueTime = new Date(dueDate).getTime();

        // Helper to send push to all subscribers in the cohort (simplified for MVP)
        const sendPushToCohort = async (alertTitle: string, alertBody: string) => {
            const { data: subs } = await supabase.from("user_subscriptions").select("*");
            if (!subs) return;

            for (const sub of subs) {
                try {
                    await webpush.sendNotification(
                        sub.subscription,
                        JSON.stringify({ title: alertTitle, body: alertBody })
                    );
                } catch (err) {
                    console.error("Push failed for sub:", sub.id, err);
                }
            }
        };

        // 1. T-Minus 48h (The Strategist)
        const t48 = dueTime - 48 * 60 * 60 * 1000;
        const wait48 = t48 - Date.now();
        if (wait48 > 0) {
            await wait.for({ seconds: wait48 / 1000 });
            await sendPushToCohort("The Strategist", `48h remaining for ${title}. Log your progress!`);
        }

        // 2. T-Minus 24h (The Reminder)
        const t24 = dueTime - 24 * 60 * 60 * 1000;
        const wait24 = t24 - Date.now();
        if (wait24 > 0) {
            await wait.for({ seconds: wait24 / 1000 });
            await sendPushToCohort("The Reminder", `24h left for ${title}. 74% of peers are in progress.`);
        }

        // 3. T-Minus 6h (The Panic Button)
        const t6 = dueTime - 6 * 60 * 60 * 1000;
        const wait6 = t6 - Date.now();
        if (wait6 > 0) {
            await wait.for({ seconds: wait6 / 1000 });
            await sendPushToCohort("THE PANIC BUTTON", `6h REMAINING for ${title}. MOVE NOW.`);
        }
    },
});
