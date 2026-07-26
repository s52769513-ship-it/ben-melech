import { UserCircle } from "lucide-react";
import SidebarAdminTools from "@/components/SidebarAdminTools";
import { ActiveAdminNavItem } from "@/components/SidebarNav";
import { getSession } from "@/lib/auth";
import { getCoordinator } from "@/lib/airtable/db";

// Everything here reads the session cookie, so each export is rendered inside
// its own <Suspense> boundary in the sidebar.

export async function SidebarUser() {
  const coordinatorId = await getSession().catch(() => null);
  if (!coordinatorId) return null;

  const name =
    coordinatorId === "ADMIN"
      ? "מנהל"
      : (await getCoordinator(coordinatorId).catch(() => null))?.name ?? null;

  if (!name) return null;

  return (
    <div className="px-6 py-3 border-b border-[#2d4f7f] flex items-center gap-2">
      <UserCircle size={16} className="text-blue-300 shrink-0" />
      <span className="text-blue-100 text-xs font-medium truncate">{name}</span>
    </div>
  );
}

export function SidebarUserFallback() {
  return (
    <div className="px-6 py-3 border-b border-[#2d4f7f] flex items-center gap-2">
      <UserCircle size={16} className="text-blue-300/50 shrink-0" />
      <span className="h-3 w-20 rounded bg-[#2d4f7f] animate-pulse" />
    </div>
  );
}

export async function SidebarAdminNav() {
  const coordinatorId = await getSession().catch(() => null);
  if (coordinatorId !== "ADMIN") return null;
  return <ActiveAdminNavItem />;
}

export async function SidebarAdminSettings() {
  const coordinatorId = await getSession().catch(() => null);
  if (coordinatorId !== "ADMIN") return null;
  return <SidebarAdminTools />;
}
