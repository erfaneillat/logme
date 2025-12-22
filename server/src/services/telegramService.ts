import axios from 'axios';
import errorLogger from './errorLoggerService';

class TelegramService {
    private botToken: string | undefined;
    private channelId: string | undefined;
    private baseUrl: string;

    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.channelId = process.env.TELEGRAM_CHANNEL_ID;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    /**
     * Send a message to the configured Telegram channel
     * @param message The message text to send
     */
    async sendMessage(message: string): Promise<void> {
        if (!this.botToken || !this.channelId) {
            console.warn('Telegram credentials not configured. Skipping notification.');
            return;
        }

        try {
            await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: this.channelId,
                text: message,
                parse_mode: 'HTML',
            });
        } catch (error: any) {
            errorLogger.error('Telegram Service Error', error);
            console.error('Failed to send Telegram notification:', error?.message);
        }
    }

    /**
     * Send a new user signup notification
     * @param phoneNumber The phone number of the new user
     * @param userId The ID of the new user
     */
    async sendSignupNotification(phoneNumber: string, userId: string): Promise<void> {
        const message = `
🚀 <b>New User Signup!</b>

📱 <b>Phone:</b> ${phoneNumber}
🆔 <b>User ID:</b> ${userId}
⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' })}
    `;
        await this.sendMessage(message);
    }

    /**
     * Send a subscription purchase notification
     * @param phoneNumber User's phone number
     * @param productKey The product key/plan purchased
     * @param amount The amount paid (if available)
     * @param orderId The order ID
     */
    async sendSubscriptionNotification(
        phoneNumber: string,
        productKey: string,
        amount: number | string | undefined,
        orderId: string
    ): Promise<void> {
        const message = `
💰 <b>New Subscription Purchased!</b>

📱 <b>User:</b> ${phoneNumber}
📦 <b>Plan:</b> ${productKey}
💵 <b>Amount:</b> ${amount || 'N/A'}
Ev <b>Order ID:</b> ${orderId}
⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' })}
    `;
        await this.sendMessage(message);
    }
}

export const telegramService = new TelegramService();
