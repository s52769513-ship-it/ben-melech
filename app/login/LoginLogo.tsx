"use client";

import { useEffect, useState } from "react";

interface Props {
  envLogoUrl: string;
  large?: boolean;
}

export default function LoginLogo({ envLogoUrl, large }: Props) {
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
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt="לוגו"
        className={large ? "max-h-52 max-w-[210px] object-contain drop-shadow-2xl" : "max-h-28 max-w-[220px] object-contain drop-shadow-xl"}
      />
    );
  }

  return (
    <div
      className={`${large ? "w-48 h-48 text-7xl" : "w-20 h-20 text-5xl"} bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20 shadow-xl select-none`}
      style={{ boxShadow: large ? "0 0 40px rgba(147,197,253,0.3)" : undefined }}
    >
      👑
    </div>
  );
}
