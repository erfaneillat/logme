// API Configuration
const isDevelopment = import.meta.env.DEV;

// Use environment variable if available, otherwise use default based on environment
export const API_BASE_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') // Remove /api suffix if present
    : isDevelopment
        ? 'http://localhost:9000'
        : 'https://loqmeapp.ir';

export const API_ENDPOINTS = {
    AUTH: {
        SEND_CODE: '/api/auth/send-code',
        VERIFY_ADMIN_PHONE: '/api/auth/admin/verify-phone',
        PROFILE: '/api/auth/profile',
    },
    USERS: {
        BASE: '/api/users',
        BY_ID: (id: string) => `/api/users/${id}`,
    },
} as const;

export const API_TIMEOUT = 30000; // 30 seconds

