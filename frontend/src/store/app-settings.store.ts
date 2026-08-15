import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppSettings {
  language: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  weekStartsOn: 0 | 1 | 6;
  notificationsEnabled: boolean;
}

interface AppSettingsStore extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  language: "en",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  weekStartsOn: 0,
  notificationsEnabled: true,
};

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) => set((s) => ({ ...s, ...settings })),
    }),
    { name: "pms-app-settings" }
  )
);
