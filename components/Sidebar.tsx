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
} from "lucide-react";

const navItems = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/coordinators", label: "רכזים", icon: Users },
  { href: "/students", label: "בחורים", icon: GraduationCap },
  { href: "/exams", label: "מבחנים", icon: BookOpen },
  { href: "/scores", label: "ציונים", icon: Star },
  { href: "/inquiries", label: "פניות", icon: MessageSquare },
  { href: "/finances", label: "כספים", icon: Wallet },
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
      </nav>
      <div className="px-6 py-4 border-t border-[#2d4f7f]">
        <p className="text-blue-400 text-xs text-center">© 2024 בן מלך</p>
      </div>
    </aside>
  );
}
