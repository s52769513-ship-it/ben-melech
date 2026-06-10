import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import ConditionalShell from "@/components/ConditionalShell";
import DynamicFavicon from "@/components/DynamicFavicon";
import { SettingsProvider } from "@/lib/settings-context";
import { getSession } from "@/lib/auth";
import { getCoordinator } from "@/lib/airtable/db";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "בן מלך - מערכת ניהול",
  description: "מערכת CRM לניהול תוכנית בן מלך",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const coordinatorId = await getSession().catch(() => null);
  const coordinator = coordinatorId
    ? await getCoordinator(coordinatorId).catch(() => null)
    : null;

  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full flex bg-gray-50 font-[family-name:var(--font-heebo)]">
        <SettingsProvider>
          <DynamicFavicon />
          <ConditionalShell coordinatorName={coordinator?.name ?? null}>
            {children}
          </ConditionalShell>
        </SettingsProvider>
      </body>
    </html>
  );
}
