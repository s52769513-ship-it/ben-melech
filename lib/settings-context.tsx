"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Settings = {
  logoUrl: string;
  airtableToken: string;
  hiddenCoordinators: string[];
  hiddenGroups: string[];
  visibleStudentFields: string[];
  studentFieldOrder: string[];
};

const DEFAULT: Settings = {
  logoUrl: "",
  airtableToken: "",
  hiddenCoordinators: [],
  hiddenGroups: [],
  visibleStudentFields: ["name", "coordinator", "city", "yeshiva", "track", "attendance", "score", "nedarim_amount", "summer_points"],
  studentFieldOrder: ["name", "phone", "id_number", "city", "street", "birth_date", "father_name", "yeshiva", "track", "enrollment_date", "coordinator", "group", "nedarim_id", "nedarim_amount", "nedarim_charged", "remaining_to_load", "summer_points", "summer_points_over_500", "attendance", "score", "notes"],
};

const SettingsContext = createContext<{
  settings: Settings;
  setLogo: (url: string) => void;
  setAirtableToken: (token: string) => void;
  toggleCoordinator: (id: string) => void;
  toggleGroup: (id: string) => void;
  toggleStudentField: (field: string) => void;
  setStudentFieldOrder: (order: string[]) => void;
  isStudentVisible: (s: { coordinator_id?: string | null; group_id?: string | null }) => boolean;
}>({
  settings: DEFAULT,
  setLogo: () => {},
  setAirtableToken: () => {},
  toggleCoordinator: () => {},
  toggleGroup: () => {},
  toggleStudentField: () => {},
  setStudentFieldOrder: () => {},
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
          visibleStudentFields: parsed.visibleStudentFields ?? DEFAULT.visibleStudentFields,
          studentFieldOrder: parsed.studentFieldOrder ?? DEFAULT.studentFieldOrder,
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

  const toggleStudentField = (field: string) => {
    const visible = settings.visibleStudentFields.includes(field)
      ? settings.visibleStudentFields.filter((x) => x !== field)
      : [...settings.visibleStudentFields, field];
    save({ ...settings, visibleStudentFields: visible });
  };

  const setStudentFieldOrder = (order: string[]) => {
    save({ ...settings, studentFieldOrder: order });
  };

  const isStudentVisible = (s: { coordinator_id?: string | null; group_id?: string | null }) => {
    if (s.coordinator_id && settings.hiddenCoordinators.includes(s.coordinator_id)) return false;
    if (s.group_id && settings.hiddenGroups.includes(s.group_id)) return false;
    return true;
  };

  return (
    <SettingsContext.Provider value={{ settings, setLogo, setAirtableToken, toggleCoordinator, toggleGroup, toggleStudentField, setStudentFieldOrder, isStudentVisible }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
