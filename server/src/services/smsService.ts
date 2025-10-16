import 'dotenv/config';
import * as Kavenegar from 'kavenegar';
import { logServiceError } from '../utils/errorLogger';

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

            let finalPhone: string;

            if (cleanPhone.startsWith('+98')) {
                // Remove +98 and keep the rest
                finalPhone = cleanPhone.substring(3);
            } else if (cleanPhone.startsWith('98')) {
                // Remove 98 and keep the rest
                finalPhone = cleanPhone.substring(2);
            } else if (cleanPhone.startsWith('09')) {
                // Already in correct format for Iranian numbers
                finalPhone = cleanPhone;
            } else if (cleanPhone.startsWith('9')) {
                // Add leading zero for Iranian numbers
                finalPhone = `0${cleanPhone}`;
            } else {
                // Default: assume it's a local number and add 09
                finalPhone = `09${cleanPhone}`;
            }

            console.log(`Sending OTP ${code} to phone: ${finalPhone}`);

            // Send OTP using Kave Negar's lookup service for OTP templates
            // You need to create a template in your Kave Negar panel first
            const result = await new Promise((resolve, reject) => {
                this.api.VerifyLookup({
                    receptor: finalPhone,
                    token: code,
                    template: process.env.KAVENEGAR_OTP_TEMPLATE || 'loqmeVerificationCode', // Default template name
                }, (response: any, status: number) => {
                    if (status === 200) {
                        console.log('SMS sent successfully:', response);
                        resolve(response);
                    } else {
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error(`SMS sending failed with status: ${status}`), { phone, response, status });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('Kave Negar Error Codes:'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 411: Insufficient Credit'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 400: Invalid Parameters'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 401: Authentication Failed'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 402: Account Deactivated'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 403: Forbidden'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 404: Template Not Found'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 405: No Template Content'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 406: Daily Limit Exceeded'), { phone });
                        logServiceError('KaveNegarSMSService', 'sendOTP', new Error('- 407: Daily Limit Exceeded for Receptor'), { phone });
                        reject(new Error(`SMS sending failed with status: ${status}`));
                    }
                });
            });

            return true;
        } catch (error) {
            logServiceError('KaveNegarSMSService', 'sendOTP', error as Error, { phone });

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
    // Use real SMS service if API key is provided, regardless of environment
    if (process.env.KAVENEGAR_API_KEY) {
        return new KaveNegarSMSService();
    }

    // Mock service only when no API key is configured
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
        return {
            async sendOTP(phone: string, code: string): Promise<boolean> {
                console.log(`Mock SMS Service: Would send OTP ${code} to ${phone}`);
                return true;
            }
        };
    }

    throw new Error('KAVENEGAR_API_KEY is required in production mode');
}
