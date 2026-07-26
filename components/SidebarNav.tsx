"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Star,
  MessageSquare,
  Wallet,
  ClipboardList,
  Settings,
  TableProperties,
  CreditCard,
} from "lucide-react";

// Server components can't hand a component down as a prop, so items carry an
// icon name and it's resolved here.
const ICONS = {
  students: GraduationCap,
  exams: BookOpen,
  scores: Star,
  attendance: ClipboardList,
  overview: TableProperties,
  inquiries: MessageSquare,
  finances: Wallet,
  nedarim: CreditCard,
  management: Settings,
} as const;

export type NavIcon = keyof typeof ICONS;

const navItems: { href: string; label: string; icon: NavIcon }[] = [
  { href: "/students", label: "בחורים", icon: "students" },
  { href: "/exams", label: "מבחנים", icon: "exams" },
  { href: "/scores", label: "ציונים", icon: "scores" },
  { href: "/attendance", label: "נוכחות", icon: "attendance" },
  { href: "/overview", label: "סקירת נוכחות", icon: "overview" },
  { href: "/inquiries", label: "פניות", icon: "inquiries" },
  { href: "/finances", label: "כספים", icon: "finances" },
  { href: "/nedarim-card", label: "נדרים קארד", icon: "nedarim" },
];

function isActive(href: string, pathname: string | null) {
  if (pathname === null) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavItem({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: NavIcon;
  pathname: string | null;
}) {
  const Icon = ICONS[icon];
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
        isActive(href, pathname)
          ? "bg-[#2d4f7f] text-white font-medium border-r-4 border-blue-400"
          : "text-blue-200 hover:bg-[#2d4f7f] hover:text-white"
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

// Rendered as the Suspense fallback: the real links, minus the highlight, so
// the sidebar is part of the static shell even on routes whose path isn't
// known until request time.
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <>
      {navItems.map((item) => (
        <NavItem key={item.href} {...item} pathname={pathname} />
      ))}
    </>
  );
}

export function AdminNavItem({ pathname }: { pathname: string | null }) {
  return <NavItem href="/management" label="ניהול" icon="management" pathname={pathname} />;
}

export function ActiveAdminNavItem() {
  return <AdminNavItem pathname={usePathname()} />;
}

export default function SidebarNav() {
  return <NavList pathname={usePathname()} />;
}
