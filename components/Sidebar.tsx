"use client";

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

  return (
    <aside className="w-64 bg-[#1e3a5f] min-h-screen flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-[#2d4f7f]">
        <h1 className="text-white text-xl font-bold tracking-wide">בן מלך</h1>
        <p className="text-blue-300 text-xs mt-1">מערכת ניהול</p>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
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
      <div className="border-t border-[#2d4f7f]">
        <div className="px-4 pt-4 pb-2">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-3 px-2">הגדרות</p>
          <div className="flex items-center justify-center bg-[#2d4f7f]/40 rounded-xl py-4 px-4">
            {/* כאן יוצב הלוגו */}
            <div className="w-20 h-20 rounded-full border-2 border-[#4a7ab5]/60 flex items-center justify-center">
              <span className="text-blue-300 text-xs text-center leading-tight">לוגו</span>
            </div>
          </div>
        </div>
        <p className="text-blue-400 text-xs text-center py-3">© 2024 בן מלך</p>
      </div>
    </aside>
  );
}
