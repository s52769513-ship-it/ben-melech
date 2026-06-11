"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings-context";

export default function DynamicFavicon() {
  const { settings } = useSettings();
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || settings.logoUrl;

  useEffect(() => {
    if (!logoUrl) return;

    document.querySelectorAll(
      "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
    ).forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = logoUrl;
    document.head.appendChild(link);
  }, [logoUrl]);

  return null;
}
