import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "امتداد جروب - نظام الإدارة",
  description: "نظام إدارة مشاريع المقاولات والعمال",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "امتداد جروب",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
