/**
 * Zarinpal Payment Gateway Service
 * 
 * This service handles all interactions with the Zarinpal payment gateway API.
 * It provides methods for creating payment requests, verifying payments, and managing transactions.
 */

import axios from 'axios';
import errorLogger from './errorLoggerService';

// Zarinpal API endpoints
const ZARINPAL_API_URL = 'https://payment.zarinpal.com/pg/v4/payment';
const ZARINPAL_SANDBOX_API_URL = 'https://sandbox.zarinpal.com/pg/v4/payment';
const ZARINPAL_GATEWAY_URL = 'https://payment.zarinpal.com/pg/StartPay';
const ZARINPAL_SANDBOX_GATEWAY_URL = 'https://sandbox.zarinpal.com/pg/StartPay';

export interface ZarinpalPaymentRequest {
    amount: number; // Amount in Rials (not Tomans)
    description: string;
    callbackUrl: string;
    mobile?: string;
    email?: string;
    orderId?: string;
    metadata?: Record<string, any>;
}

export interface ZarinpalPaymentResponse {
    success: boolean;
    authority?: string;
    paymentUrl?: string;
    code?: number;
    message?: string;
    feeType?: string;
    fee?: number;
}

export interface ZarinpalVerifyRequest {
    authority: string;
    amount: number; // Amount in Rials
}

export interface ZarinpalVerifyResponse {
    success: boolean;
    refId?: number;
    cardPan?: string;
    cardHash?: string;
    code?: number;
    message?: string;
    feeType?: string;
    fee?: number;
}

export interface ZarinpalInquiryResponse {
    success: boolean;
    code?: number;
    message?: string;
    refId?: number;
    cardPan?: string;
    cardHash?: string;
    feeType?: string;
    fee?: number;
}

// Error code mappings for Zarinpal
const ZARINPAL_ERROR_CODES: Record<number, string> = {
    '-9': 'خطای اعتبار سنجی. مقادیر ارسالی صحیح نیست.',
    '-10': 'آی‌پی یا مرچنت کد پذیرنده صحیح نیست.',
    '-11': 'مرچنت کد فعال نیست.',
    '-12': 'تلاش بیش از حد در یک بازه زمانی کوتاه.',
    '-15': 'ترمینال شما به حالت تعلیق در آمده است.',
    '-16': 'سطح تایید پذیرنده پایین‌تر از سطح نقره‌ای است.',
    '-30': 'اجازه دسترسی به تسویه اشتراکی شناور ندارید.',
    '-31': 'حساب بانکی تسویه را به پنل اضافه کنید.',
    '-32': 'Wages is not valid.',
    '-33': 'درصد تسهیم از سقف مجاز بیشتر است.',
    '-34': 'مبلغ از کل تراکنش بیشتر است.',
    '-35': 'تعداد افراد تسهیم از حد مجاز بیشتر است.',
    '-40': 'پارامترهای extra صحیح نیست.',
    '-50': 'مبلغ پرداخت شده با مقدار مبلغ در وریفای متفاوت است.',
    '-51': 'پرداخت ناموفق.',
    '-52': 'خطای غیرمنتظره‌ای رخ داده است.',
    '-53': 'اتوریتی برای این مرچنت کد نیست.',
    '-54': 'اتوریتی نامعتبر است.',
    100: 'عملیات موفق',
    101: 'تراکنش قبلا وریفای شده است.',
};

export class ZarinpalService {
    private merchantId: string;
    private isSandbox: boolean;
    private apiUrl: string;
    private gatewayUrl: string;

    constructor(merchantId?: string, sandbox?: boolean) {
        this.merchantId = merchantId || process.env.ZARINPAL_MERCHANT_ID || '';
        this.isSandbox = sandbox ?? (process.env.ZARINPAL_SANDBOX === 'true');

        this.apiUrl = this.isSandbox ? ZARINPAL_SANDBOX_API_URL : ZARINPAL_API_URL;
        this.gatewayUrl = this.isSandbox ? ZARINPAL_SANDBOX_GATEWAY_URL : ZARINPAL_GATEWAY_URL;

        if (!this.merchantId) {
            console.warn('⚠️ ZARINPAL_MERCHANT_ID is not configured');
        }
    }

    /**
     * Create a new payment request
     * This generates an authority code and returns the payment URL
     */
    async createPayment(request: ZarinpalPaymentRequest): Promise<ZarinpalPaymentResponse> {
        try {
            if (!this.merchantId) {
                return {
                    success: false,
                    code: -10,
                    message: 'Merchant ID is not configured',
                };
            }

            console.log('🏦 Creating Zarinpal payment:', {
                amount: request.amount,
                description: request.description,
                callbackUrl: request.callbackUrl,
                orderId: request.orderId,
            });

            const payload = {
                merchant_id: this.merchantId,
                amount: request.amount,
                description: request.description,
                callback_url: request.callbackUrl,
                metadata: {
                    mobile: request.mobile,
                    email: request.email,
                    order_id: request.orderId,
                    ...request.metadata,
                },
            };

            const response = await axios.post(`${this.apiUrl}/request.json`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            });

            const { data } = response;

            if (data.data?.code === 100 && data.data?.authority) {
                const authority = data.data.authority;
                const paymentUrl = `${this.gatewayUrl}/${authority}`;

                console.log('✅ Payment request created:', {
                    authority,
                    paymentUrl,
                    fee: data.data.fee,
                    feeType: data.data.fee_type,
                });

                return {
                    success: true,
                    authority,
                    paymentUrl,
                    code: 100,
                    message: 'عملیات موفق',
                    fee: data.data.fee,
                    feeType: data.data.fee_type,
                };
            }

            const errorCode = data.errors?.code || data.data?.code || -52;
            const errorMessage = ZARINPAL_ERROR_CODES[errorCode] || data.errors?.message || 'خطای ناشناخته';

            console.error('❌ Zarinpal payment request failed:', {
                code: errorCode,
                message: errorMessage,
                response: data,
            });

            return {
                success: false,
                code: errorCode,
                message: errorMessage,
            };
        } catch (error: any) {
            errorLogger.error('Zarinpal createPayment error:', error);

            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status;
                const errorData = error.response?.data;

                console.error('❌ Zarinpal API error:', {
                    status: statusCode,
                    data: errorData,
                    message: error.message,
                });

                return {
                    success: false,
                    code: -52,
                    message: errorData?.errors?.message || 'خطا در ارتباط با درگاه پرداخت',
                };
            }

            return {
                success: false,
                code: -52,
                message: 'خطای غیرمنتظره در ایجاد پرداخت',
            };
        }
    }

    /**
     * Verify a payment after callback from Zarinpal
     * This should be called after the user returns from the payment gateway
     */
    async verifyPayment(request: ZarinpalVerifyRequest): Promise<ZarinpalVerifyResponse> {
        try {
            if (!this.merchantId) {
                return {
                    success: false,
                    code: -10,
                    message: 'Merchant ID is not configured',
                };
            }

            console.log('🔍 Verifying Zarinpal payment:', {
                authority: request.authority,
                amount: request.amount,
            });

            const payload = {
                merchant_id: this.merchantId,
                authority: request.authority,
                amount: request.amount,
            };

            const response = await axios.post(`${this.apiUrl}/verify.json`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            });

            const { data } = response;

            // Success codes: 100 (first verification) or 101 (already verified)
            if (data.data?.code === 100 || data.data?.code === 101) {
                console.log('✅ Payment verified successfully:', {
                    refId: data.data.ref_id,
                    cardPan: data.data.card_pan,
                    fee: data.data.fee,
                    feeType: data.data.fee_type,
                    alreadyVerified: data.data.code === 101,
                });

                return {
                    success: true,
                    refId: data.data.ref_id,
                    cardPan: data.data.card_pan,
                    cardHash: data.data.card_hash,
                    code: data.data.code,
                    message: ZARINPAL_ERROR_CODES[data.data.code] || 'عملیات موفق',
                    fee: data.data.fee,
                    feeType: data.data.fee_type,
                };
            }

            const errorCode = data.errors?.code || data.data?.code || -51;
            const errorMessage = ZARINPAL_ERROR_CODES[errorCode] || data.errors?.message || 'پرداخت ناموفق';

            console.error('❌ Payment verification failed:', {
                code: errorCode,
                message: errorMessage,
                response: data,
            });

            return {
                success: false,
                code: errorCode,
                message: errorMessage,
            };
        } catch (error: any) {
            errorLogger.error('Zarinpal verifyPayment error:', error);

            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data;
                return {
                    success: false,
                    code: -52,
                    message: errorData?.errors?.message || 'خطا در تایید پرداخت',
                };
            }

            return {
                success: false,
                code: -52,
                message: 'خطای غیرمنتظره در تایید پرداخت',
            };
        }
    }

    /**
     * Inquire about a transaction status
     * Useful for checking payment status when verification fails or for debugging
     */
    async inquirePayment(authority: string): Promise<ZarinpalInquiryResponse> {
        try {
            if (!this.merchantId) {
                return {
                    success: false,
                    code: -10,
                    message: 'Merchant ID is not configured',
                };
            }

            console.log('🔍 Inquiring Zarinpal payment:', { authority });

            const payload = {
                merchant_id: this.merchantId,
                authority,
            };

            const response = await axios.post(`${this.apiUrl}/inquiry.json`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            });

            const { data } = response;

            if (data.data?.code === 100 || data.data?.code === 101) {
                return {
                    success: true,
                    refId: data.data.ref_id,
                    cardPan: data.data.card_pan,
                    cardHash: data.data.card_hash,
                    code: data.data.code,
                    message: ZARINPAL_ERROR_CODES[data.data.code] || 'عملیات موفق',
                    fee: data.data.fee,
                    feeType: data.data.fee_type,
                };
            }

            const errorCode = data.errors?.code || -51;
            return {
                success: false,
                code: errorCode,
                message: ZARINPAL_ERROR_CODES[errorCode] || 'تراکنش یافت نشد',
            };
        } catch (error: any) {
            errorLogger.error('Zarinpal inquirePayment error:', error);
            return {
                success: false,
                code: -52,
                message: 'خطا در استعلام پرداخت',
            };
        }
    }

    /**
     * Get the payment gateway redirect URL for a given authority
     */
    getPaymentUrl(authority: string): string {
        return `${this.gatewayUrl}/${authority}`;
    }

    /**
     * Convert Tomans to Rials
     * Zarinpal API works with Rials
     */
    static tomansToRials(tomans: number): number {
        return tomans * 10;
    }

    /**
     * Convert Rials to Tomans
     */
    static rialsToTomans(rials: number): number {
        return Math.floor(rials / 10);
    }

    /**
     * Create an instance from environment variables
     */
    static fromEnvironment(): ZarinpalService {
        return new ZarinpalService();
    }
}

// Export singleton instance
export const zarinpalService = ZarinpalService.fromEnvironment();

export default zarinpalService;
