
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "لقمه",
  description: "یک ردیاب کالری و ماکرو هوشمند که از هوش مصنوعی برای تحلیل عکس غذا و پیگیری اهداف تغذیه روزانه شما استفاده می‌کند.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`antialiased bg-[#F0F2F5] text-gray-900`}
        style={{ fontFamily: "'Vazirmatn', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
