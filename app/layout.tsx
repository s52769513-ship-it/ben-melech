import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import DynamicFavicon from "@/components/DynamicFavicon";
import { SettingsProvider } from "@/lib/settings-context";
import { DEFAULT_LOGO_URL } from "@/lib/logo";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "בן מלך - מערכת ניהול",
  description: "מערכת CRM לניהול תוכנית בן מלך",
  icons: {
    icon: DEFAULT_LOGO_URL,
    apple: DEFAULT_LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-[family-name:var(--font-heebo)]">
        <SettingsProvider>
          <DynamicFavicon />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
