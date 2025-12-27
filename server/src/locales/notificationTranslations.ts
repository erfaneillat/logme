/**
 * Notification translations for multi-language push notifications
 * Each user receives notifications in their preferred language
 */

export type NotificationLocale = 'en' | 'fa';

interface NotificationTranslations {
    // Ticket notifications
    ticketReply: {
        title: string;
        body: (ticketSubject: string) => string;
    };
    ticketStatusChange: {
        title: string;
        body: (ticketSubject: string, statusText: string) => string;
    };
    // Daily reminder notifications
    dailyReminder: {
        title: string;
        messages: string[];
    };
    // Inactivity reminder notifications
    inactivityReminder: {
        title: string;
        messages: Record<number, string>;
    };
    // Status translations
    statuses: Record<string, string>;
}

const translations: Record<NotificationLocale, NotificationTranslations> = {
    fa: {
        ticketReply: {
            title: 'پاسخ جدید به تیکت شما',
            body: (ticketSubject: string) => `پشتیبانی به تیکت شما پاسخ داد: «${ticketSubject}»`,
        },
        ticketStatusChange: {
            title: 'وضعیت تیکت به‌روزرسانی شد',
            body: (ticketSubject: string, statusText: string) => `وضعیت تیکت «${ticketSubject}» به ${statusText} تغییر کرد`,
        },
        dailyReminder: {
            title: 'یادآور روزانه',
            messages: [
                'وقتشه غذات رو ثبت کنی\nعکس بگیر تا بدونی چند کالری داری می‌خوری!',
                'یادت نره امروز کالری‌هات رو چک کنی',
                'فقط چند ثانیه لازمه برای ثبت وعده‌هات ⏱',
            ],
        },
        inactivityReminder: {
            title: 'یادآور بازگشت',
            messages: {
                2: 'دو روزه غذات رو ثبت نکردی، برگرد و مسیرت رو ادامه بده.',
                3: 'یادت رفت کالری‌هات رو ثبت کنی؟ هر روز فقط چند ثانیه زمان می‌بره',
                5: 'بدون ثبت روزانه، پیشرفت دیده نمی‌شه. همین الان برگرد!',
                7: 'یک هفته‌ست سر نزدی، همه زحماتت از دست می‌ره. برگرد و از همین‌جا ادامه بده.',
                10: 'برگرد و پیشرفتت رو از نو شروع کن. لقمه همیشه اینجاست',
                15: 'برگرد و پیشرفتت رو از نو شروع کن. لقمه همیشه اینجاست',
            },
        },
        statuses: {
            OPEN: 'باز',
            IN_PROGRESS: 'در حال رسیدگی',
            RESOLVED: 'حل شد',
            CLOSED: 'بسته شد',
            PENDING: 'در انتظار',
        },
    },
    en: {
        ticketReply: {
            title: 'New Reply to Your Ticket',
            body: (ticketSubject: string) => `Support has replied to your ticket: "${ticketSubject}"`,
        },
        ticketStatusChange: {
            title: 'Ticket Status Updated',
            body: (ticketSubject: string, statusText: string) => `The status of ticket "${ticketSubject}" has changed to ${statusText}`,
        },
        dailyReminder: {
            title: 'Daily Reminder',
            messages: [
                "Time to log your meal!\nTake a photo to track your calories!",
                "Don't forget to check your calories today",
                "It only takes a few seconds to log your meals ⏱",
            ],
        },
        inactivityReminder: {
            title: 'We Miss You!',
            messages: {
                2: "You haven't logged food for 2 days. Come back and continue your journey!",
                3: 'Forgot to log your calories? It only takes a few seconds each day.',
                5: 'Without daily logging, progress is hard to track. Come back now!',
                7: "It's been a week since you last logged. Don't let your progress slip away!",
                10: 'Come back and restart your journey. We are always here for you!',
                15: 'Come back and restart your journey. We are always here for you!',
            },
        },
        statuses: {
            OPEN: 'Open',
            IN_PROGRESS: 'In Progress',
            RESOLVED: 'Resolved',
            CLOSED: 'Closed',
            PENDING: 'Pending',
        },
    },
};

/**
 * Get notification translations for a specific locale
 */
export function getNotificationTranslations(locale: NotificationLocale): NotificationTranslations {
    return translations[locale] || translations.en;
}

/**
 * Translate a status string to the target locale
 */
export function translateStatus(status: string, locale: NotificationLocale): string {
    const t = getNotificationTranslations(locale);
    return t.statuses[status] ?? status.replace('_', ' ').toLowerCase();
}

/**
 * Get a random daily reminder message in the target locale
 */
export function getDailyReminderMessage(locale: NotificationLocale): { title: string; body: string } {
    const t = getNotificationTranslations(locale);
    const idx = Math.floor(Math.random() * t.dailyReminder.messages.length);
    const body = (t.dailyReminder.messages[idx] || t.dailyReminder.messages[0]) as string;
    return {
        title: t.dailyReminder.title,
        body,
    };
}

/**
 * Get inactivity reminder message for a specific number of days
 */
export function getInactivityReminderMessage(days: number, locale: NotificationLocale): { title: string; body: string } | null {
    const t = getNotificationTranslations(locale);
    const body = t.inactivityReminder.messages[days];
    if (!body) return null;
    return {
        title: t.inactivityReminder.title,
        body,
    };
}

/**
 * Get ticket reply notification message
 */
export function getTicketReplyMessage(ticketSubject: string, locale: NotificationLocale): { title: string; body: string } {
    const t = getNotificationTranslations(locale);
    return {
        title: t.ticketReply.title,
        body: t.ticketReply.body(ticketSubject),
    };
}

/**
 * Get ticket status change notification message
 */
export function getTicketStatusChangeMessage(ticketSubject: string, status: string, locale: NotificationLocale): { title: string; body: string } {
    const t = getNotificationTranslations(locale);
    const statusText = translateStatus(status, locale);
    return {
        title: t.ticketStatusChange.title,
        body: t.ticketStatusChange.body(ticketSubject, statusText),
    };
}

export default {
    getNotificationTranslations,
    translateStatus,
    getDailyReminderMessage,
    getInactivityReminderMessage,
    getTicketReplyMessage,
    getTicketStatusChangeMessage,
};
