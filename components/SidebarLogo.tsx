"use client";

import { useSettings } from "@/lib/settings-context";
import { DEFAULT_LOGO_URL } from "@/lib/logo";

export default function SidebarLogo() {
  const { settings } = useSettings();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={process.env.NEXT_PUBLIC_LOGO_URL || settings.logoUrl || DEFAULT_LOGO_URL}
      alt="לוגו"
      className="max-h-16 max-w-full object-contain"
    />
  );
}
