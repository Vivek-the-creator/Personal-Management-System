import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CalendarWorkspaceState {
  selectedCalendarId: string | null;
  setSelectedCalendarId: (id: string | null) => void;
}

export const useCalendarWorkspaceStore = create<CalendarWorkspaceState>()(
  persist(
    (set) => ({
      selectedCalendarId: null,
      setSelectedCalendarId: (id) => set({ selectedCalendarId: id }),
    }),
    { name: "doodo-calendar-workspace" }
  )
);
