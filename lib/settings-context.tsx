"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Settings = {
  logoUrl: string;
  airtableToken: string;
  hiddenCoordinators: string[];
  hiddenGroups: string[];
};

const DEFAULT: Settings = {
  logoUrl: "",
  airtableToken: "",
  hiddenCoordinators: [],
  hiddenGroups: [],
};

const SettingsContext = createContext<{
  settings: Settings;
  setLogo: (url: string) => void;
  setAirtableToken: (token: string) => void;
  toggleCoordinator: (id: string) => void;
  toggleGroup: (id: string) => void;
  isStudentVisible: (s: { coordinator_id?: string | null; group_id?: string | null }) => boolean;
}>({
  settings: DEFAULT,
  setLogo: () => {},
  setAirtableToken: () => {},
  toggleCoordinator: () => {},
  toggleGroup: () => {},
  isStudentVisible: () => true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    const stored = localStorage.getItem("app-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({
          ...DEFAULT,
          ...parsed,
          hiddenCoordinators: parsed.hiddenCoordinators ?? [],
          hiddenGroups: parsed.hiddenGroups ?? [],
        });
      } catch { /* ignore */ }
    }
  }, []);

  const save = (next: Settings) => {
    setSettings(next);
    localStorage.setItem("app-settings", JSON.stringify(next));
  };

  const setLogo = (url: string) => save({ ...settings, logoUrl: url });
  const setAirtableToken = (token: string) => save({ ...settings, airtableToken: token });

  const toggleCoordinator = (id: string) => {
    const hidden = settings.hiddenCoordinators.includes(id)
      ? settings.hiddenCoordinators.filter((x) => x !== id)
      : [...settings.hiddenCoordinators, id];
    save({ ...settings, hiddenCoordinators: hidden });
  };

  const toggleGroup = (id: string) => {
    const hidden = settings.hiddenGroups.includes(id)
      ? settings.hiddenGroups.filter((x) => x !== id)
      : [...settings.hiddenGroups, id];
    save({ ...settings, hiddenGroups: hidden });
  };

  const isStudentVisible = (s: { coordinator_id?: string | null; group_id?: string | null }) => {
    if (s.coordinator_id && settings.hiddenCoordinators.includes(s.coordinator_id)) return false;
    if (s.group_id && settings.hiddenGroups.includes(s.group_id)) return false;
    return true;
  };

  return (
    <SettingsContext.Provider value={{ settings, setLogo, setAirtableToken, toggleCoordinator, toggleGroup, isStudentVisible }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
