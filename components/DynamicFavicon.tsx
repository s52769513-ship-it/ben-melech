"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings-context";

export default function DynamicFavicon() {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.logoUrl) return;

    // Remove every existing favicon
    document.querySelectorAll(
      "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
    ).forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = settings.logoUrl;
    document.head.appendChild(link);
  }, [settings.logoUrl]);

  return null;
}
