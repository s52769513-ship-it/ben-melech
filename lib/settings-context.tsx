"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Settings = {
  hideKibbutz: boolean;
  logoUrl: string;
};

const DEFAULT: Settings = { hideKibbutz: false, logoUrl: "" };

const SettingsContext = createContext<{
  settings: Settings;
  toggle: (key: "hideKibbutz") => void;
  setLogo: (url: string) => void;
}>({
  settings: DEFAULT,
  toggle: () => {},
  setLogo: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    const stored = localStorage.getItem("app-settings");
    if (stored) {
      try { setSettings({ ...DEFAULT, ...JSON.parse(stored) }); } catch { /* ignore */ }
    }
  }, []);

  const save = (next: Settings) => {
    setSettings(next);
    localStorage.setItem("app-settings", JSON.stringify(next));
  };

  const toggle = (key: "hideKibbutz") =>
    save({ ...settings, [key]: !settings[key] });

  const setLogo = (url: string) =>
    save({ ...settings, logoUrl: url });

  return (
    <SettingsContext.Provider value={{ settings, toggle, setLogo }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
