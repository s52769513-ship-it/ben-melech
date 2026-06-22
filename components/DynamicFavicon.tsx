"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings-context";

export default function DynamicFavicon() {
  const { settings } = useSettings();
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || settings.logoUrl;

  useEffect(() => {
    const url = logoUrl || "/לוגו חתוך בן מלך.png";

    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = url;
    link.type = "image/png";

    const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleLink) {
      appleLink.href = url;
    } else {
      const apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      apple.href = url;
      document.head.appendChild(apple);
    }
  }, [logoUrl]);

  return null;
}
