import 'dotenv/config';
import * as Kavenegar from 'kavenegar';

export interface SMSServiceInterface {
    sendOTP(phone: string, code: string): Promise<boolean>;
}

export class KaveNegarSMSService implements SMSServiceInterface {
    private api: any;

    constructor() {
        const apiKey = process.env.KAVENEGAR_API_KEY;
        if (!apiKey) {
            throw new Error('KAVENEGAR_API_KEY environment variable is required');
        }
        this.api = Kavenegar.KavenegarApi({ apikey: apiKey });
    }

    async sendOTP(phone: string, code: string): Promise<boolean> {
        try {
            // Clean phone number - remove any non-digit characters except +
            const cleanPhone = phone.replace(/[^\d+]/g, '');

            // If phone starts with +98, remove the +
            const formattedPhone = cleanPhone.startsWith('+98')
                ? cleanPhone.substring(3)
                : cleanPhone.startsWith('98')
                    ? cleanPhone.substring(2)
                    : cleanPhone;

            // Ensure phone starts with 9 for Iranian numbers
            const finalPhone = formattedPhone.startsWith('9') ? formattedPhone : `9${formattedPhone}`;

            console.log(`Sending OTP ${code} to phone: ${finalPhone}`);

            // Send OTP using Kave Negar's lookup service for OTP templates
            // You need to create a template in your Kave Negar panel first
            const result = await new Promise((resolve, reject) => {
                this.api.VerifyLookup({
                    receptor: finalPhone,
                    token: code,
                    template: process.env.KAVENEGAR_OTP_TEMPLATE || 'verify', // Default template name
                }, (response: any, status: number) => {
                    if (status === 200) {
                        console.log('SMS sent successfully:', response);
                        resolve(response);
                    } else {
                        console.error('SMS sending failed:', response, 'Status:', status);
                        reject(new Error(`SMS sending failed with status: ${status}`));
                    }
                });
            });

            return true;
        } catch (error) {
            console.error('Error sending OTP via Kave Negar:', error);

            // In development mode, don't fail if SMS service is not configured
            if (process.env.NODE_ENV === 'development') {
                console.log(`Development mode: Would send OTP ${code} to ${phone}`);
                return true;
            }

            return false;
        }
    }
}

// Factory function to create SMS service
export function createSMSService(): SMSServiceInterface {
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && !process.env.KAVENEGAR_API_KEY) {
        // Mock service for development
        return {
            async sendOTP(phone: string, code: string): Promise<boolean> {
                console.log(`Mock SMS Service: Would send OTP ${code} to ${phone}`);
                return true;
            }
        };
    }

    return new KaveNegarSMSService();
}
