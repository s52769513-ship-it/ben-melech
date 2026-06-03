"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Star,
  MessageSquare,
  Wallet,
  ClipboardList,
  Settings,
  TableProperties,
} from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import SettingsPanel from "@/components/SettingsPanel";

const navItems = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/coordinators", label: "משפיעים", icon: Users },
  { href: "/students", label: "בחורים", icon: GraduationCap },
  { href: "/exams", label: "מבחנים", icon: BookOpen },
  { href: "/scores", label: "ציונים", icon: Star },
  { href: "/attendance", label: "נוכחות", icon: ClipboardList },
  { href: "/overview", label: "סקירת נוכחות", icon: TableProperties },
  { href: "/inquiries", label: "פניות", icon: MessageSquare },
  { href: "/finances", label: "כספים", icon: Wallet },
];

const managementItems = [
  { href: "/management", label: "ניהול", icon: Settings },
];


export default function Sidebar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <aside className="w-64 bg-[#1e3a5f] min-h-screen flex flex-col shrink-0">

        {/* Header — logo or text */}
        <div className="border-b border-[#2d4f7f] flex items-center justify-center min-h-[80px] px-4 py-4">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt="לוגו"
              className="max-h-16 max-w-full object-contain"
            />
          ) : (
            <div className="text-right w-full px-2">
              <h1 className="text-white text-xl font-bold tracking-wide">בן מלך</h1>
              <p className="text-blue-300 text-xs mt-1">מערכת ניהול</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-[#2d4f7f] text-white font-medium border-r-4 border-blue-400"
                    : "text-blue-200 hover:bg-[#2d4f7f] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
          <div className="mx-6 my-2 border-t border-[#2d4f7f]" />
          {managementItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-[#2d4f7f] text-white font-medium border-r-4 border-blue-400"
                    : "text-blue-200 hover:bg-[#2d4f7f] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom bar */}
        <div className="border-t border-[#2d4f7f]">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-6 py-3.5 text-sm text-blue-200 hover:bg-[#2d4f7f] hover:text-white transition-colors"
          >
            <Settings size={16} />
            <span>הגדרות</span>
          </button>
          <p className="text-blue-400 text-xs text-center py-2.5">© 2024 בן מלך</p>
        </div>
      </aside>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
