import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "امتداد جروب - نظام الإدارة",
  description: "نظام إدارة مشاريع المقاولات والعمال",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
