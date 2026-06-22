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
  icons: {
    icon: "/לוגו חתוך בן מלך.png",
    apple: "/לוגו חתוך בן מלך.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const coordinatorId = await getSession().catch(() => null);
  const isAdmin = coordinatorId === "ADMIN";
  const coordinator = coordinatorId && !isAdmin
    ? await getCoordinator(coordinatorId).catch(() => null)
    : null;
  const coordinatorName = isAdmin ? "מנהל" : (coordinator?.name ?? null);

  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-[family-name:var(--font-heebo)]">
        <SettingsProvider>
          <DynamicFavicon />
          <ConditionalShell coordinatorName={coordinatorName} isAdmin={isAdmin}>
            {children}
          </ConditionalShell>
        </SettingsProvider>
      </body>
    </html>
  );
}
