"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ZmanimBar from "./ZmanimBar";

interface Props {
  coordinatorName: string | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export default function ConditionalShell({ coordinatorName, isAdmin, children }: Props) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar coordinatorName={coordinatorName} isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <ZmanimBar />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
