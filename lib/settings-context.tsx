"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Settings = { hideKibbutz: boolean };

const SettingsContext = createContext<{
  settings: Settings;
  toggle: (key: keyof Settings) => void;
}>({
  settings: { hideKibbutz: false },
  toggle: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ hideKibbutz: false });

  useEffect(() => {
    const stored = localStorage.getItem("app-settings");
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const toggle = (key: keyof Settings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("app-settings", JSON.stringify(next));
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, toggle }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
