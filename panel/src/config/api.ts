// API Configuration
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment
    ? 'http://localhost:9000'
    : 'https://loqmeapp.ir';

export const API_ENDPOINTS = {
    AUTH: {
        SEND_CODE: '/api/auth/send-code',
        VERIFY_ADMIN_PHONE: '/api/auth/admin/verify-phone',
        PROFILE: '/api/auth/profile',
    },
} as const;

export const API_TIMEOUT = 30000; // 30 seconds

