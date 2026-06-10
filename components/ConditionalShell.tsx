"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ZmanimBar from "./ZmanimBar";

interface Props {
  coordinatorName: string | null;
  children: React.ReactNode;
}

export default function ConditionalShell({ coordinatorName, children }: Props) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar coordinatorName={coordinatorName} />
      <main className="flex-1 overflow-auto flex flex-col">
        <ZmanimBar />
        <div className="flex-1">{children}</div>
      </main>
    </>
  );
}
