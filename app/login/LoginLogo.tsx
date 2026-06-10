"use client";

import { useEffect, useState } from "react";

export default function LoginLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app-settings");
      if (stored) {
        const s = JSON.parse(stored);
        if (s.logoUrl) setLogoUrl(s.logoUrl);
      }
    } catch { /* ignore */ }
  }, []);

  if (logoUrl) {
    return (
      <div className="flex items-center justify-center mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="לוגו"
          className="max-h-24 max-w-[200px] object-contain drop-shadow-lg"
        />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-xl text-5xl select-none">
        👑
      </div>
    </div>
  );
}
