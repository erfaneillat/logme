
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./context/ToastContext";
import ServiceWorkerManager from "./components/ServiceWorkerManager";
import { VersionCheckWrapper } from "./components/VersionCheckWrapper";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const isGlobal = process.env.NEXT_PUBLIC_MARKET === 'global';

export const metadata: Metadata = {
  title: isGlobal ? "Slice" : "لقمه",
  description: isGlobal
    ? "A smart calorie and macro tracker that uses AI to analyze food photos and track your daily nutrition goals."
    : "یک ردیاب کالری و ماکرو هوشمند که از هوش مصنوعی برای تحلیل عکس غذا و پیگیری اهداف تغذیه روزانه شما استفاده می‌کند.",
  manifest: "/app/manifest.json",
  icons: {
    icon: '/app/loqme_logo.png',
    apple: '/app/loqme_logo.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: "cover", // Added for notch support
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={isGlobal ? "en" : "fa"}
      dir={isGlobal ? "ltr" : "rtl"}
      className={isGlobal ? "" : vazirmatn.variable}
    >
      <head>
        {!isGlobal && (
          <link
            href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body
        className={`antialiased bg-[#F0F2F5] text-gray-900`}
        style={{ fontFamily: isGlobal ? "system-ui, -apple-system, sans-serif" : "'Vazirmatn', sans-serif" }}
      >
        <ToastProvider>
          <ServiceWorkerManager />
          <VersionCheckWrapper>
            {children}
          </VersionCheckWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
