import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "בן מלך - מערכת ניהול",
  description: "מערכת CRM לניהול תוכנית בן מלך",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full flex bg-gray-50 font-[family-name:var(--font-heebo)]">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
