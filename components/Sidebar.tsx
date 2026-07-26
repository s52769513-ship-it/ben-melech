import { Suspense } from "react";
import { LogOut } from "lucide-react";
import SidebarLogo from "@/components/SidebarLogo";
import SidebarNav, { NavList } from "@/components/SidebarNav";
import {
  SidebarUser,
  SidebarUserFallback,
  SidebarAdminNav,
  SidebarAdminSettings,
} from "@/components/SidebarSession";
import { logout } from "@/app/login/actions";

// Server component: the chrome below is part of the static shell, so it paints
// the instant a navigation starts. The two things that can't be known ahead of
// time — the current path (for the highlight) and the session — stream in
// behind their own boundaries.
export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1e3a5f] min-h-screen flex flex-col shrink-0">

      {/* Header */}
      <div className="border-b border-[#2d4f7f] flex items-center justify-center min-h-[80px] px-4 py-4">
        <SidebarLogo />
      </div>

      {/* Coordinator info */}
      <Suspense fallback={<SidebarUserFallback />}>
        <SidebarUser />
      </Suspense>

      <nav className="flex-1 py-4">
        <Suspense fallback={<NavList pathname={null} />}>
          <SidebarNav />
        </Suspense>
        <Suspense fallback={null}>
          <SidebarAdminNav />
        </Suspense>
      </nav>

      {/* Bottom bar */}
      <div className="border-t border-[#2d4f7f]">
        <Suspense fallback={null}>
          <SidebarAdminSettings />
        </Suspense>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-6 py-3.5 text-sm text-blue-200 hover:bg-red-900/40 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} />
            <span>יציאה</span>
          </button>
        </form>
        <p className="text-blue-400 text-xs text-center py-2.5">© 2024 בן מלך</p>
      </div>
    </aside>
  );
}
