import { Resend } from 'resend';
import { NotificationEmail } from '@/emails/NotificationEmail';

const resend = new Resend(process.env.RESEND_API_Key);

export async function sendWelcomeEmail(email: string, firstName: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@logichq.tech',
            to: [email],
            subject: `You're in, ${firstName}! Welcome to Notify 🧡`,
            react: NotificationEmail({ 
                firstName,
                subject: `You're in, ${firstName}! Welcome to Notify 🧡`,
                type: 'welcome',
            }),
        });

        if (error) {
            console.error(`[email] Failed to send welcome to ${email}:`, error);
            return { success: false, error };
        }
        return { success: true, id: data?.id };
    } catch (err: any) {
        console.error(`[email] Exception sending welcome to ${email}:`, err.message);
        return { success: false, error: err.message };
    }
}

export async function sendNotificationEmail(params: {
    email: string;
    firstName: string;
    subject: string;
    type: 'warden' | 'briefing' | 'assignment';
    moduleName?: string;
    venue?: string;
    time?: string;
    alertType?: 'upcoming' | 'started';
    briefingType?: 'morning' | 'evening';
    classCount?: number;
    deadline?: { title: string; days: string };
    cohortPct?: number;
    bodyText?: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'alerts@logichq.tech',
            to: [params.email],
            subject: params.subject,
            react: NotificationEmail(params),
        });

        if (error) {
            console.error(`[email] Failed to send ${params.type} email to ${params.email}:`, error);
            return { success: false, error };
        }
        return { success: true, id: data?.id };
    } catch (err: any) {
        console.error(`[email] Exception sending email to ${params.email}:`, err.message);
        return { success: false, error: err.message };
    }
}
