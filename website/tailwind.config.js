/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'calz-green': '#FFFFFF',
                'calz-dark': '#000000',
                'calz-gray': '#6B7280',
                'calz-light': '#F9FAFB',
                'calz-accent': '#E5E7EB',
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'farsi': ['Vazir', 'Tahoma', 'Arial', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'scan': 'scan 2s ease-in-out infinite',
                'fade-in': 'fadeIn 0.5s ease-in-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [
        require('tailwindcss-rtl'),
    ],
}
