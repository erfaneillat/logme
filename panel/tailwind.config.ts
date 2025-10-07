import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#000000',
                    hover: '#1f1f1f',
                },
            },
        }
    },
    plugins: []
};

export default config;

