"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import SettingsPanel from "@/components/SettingsPanel";

export default function SidebarAdminTools() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-6 py-3.5 text-sm text-blue-200 hover:bg-[#2d4f7f] hover:text-white transition-colors"
      >
        <Settings size={16} />
        <span>הגדרות</span>
      </button>
      {open && <SettingsPanel onClose={() => setOpen(false)} />}
    </>
  );
}
