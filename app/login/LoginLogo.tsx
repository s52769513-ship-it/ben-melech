"use client";

import { useEffect, useState } from "react";

interface Props {
  envLogoUrl: string;
}

export default function LoginLogo({ envLogoUrl }: Props) {
  const [localUrl, setLocalUrl] = useState("");

  useEffect(() => {
    if (envLogoUrl) return;
    try {
      const stored = localStorage.getItem("app-settings");
      if (stored) {
        const s = JSON.parse(stored);
        if (s.logoUrl) setLocalUrl(s.logoUrl);
      }
    } catch { /* ignore */ }
  }, [envLogoUrl]);

  const logoUrl = envLogoUrl || localUrl;

  if (logoUrl) {
    return (
      <div className="flex items-center justify-center mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="לוגו"
          className="max-h-28 max-w-[220px] object-contain drop-shadow-xl"
        />
      </div>
    );
  }

  return (
    <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-xl text-5xl select-none">
      👑
    </div>
  );
}
