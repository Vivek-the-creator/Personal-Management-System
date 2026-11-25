import { create } from "zustand";
import { nextMonth, previousMonth, startOfMonth } from "@/utils/calendar";

interface CalendarState {
  visibleMonth: Date;
  direction: 1 | -1;
  requestedDate: Date | null;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  setVisibleMonth: (date: Date, direction?: 1 | -1) => void;
  setRequestedDate: (date: Date | null) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  visibleMonth: startOfMonth(new Date()),
  direction: 1,
  requestedDate: null,
  goToPreviousMonth: () =>
    set((state) => ({
      visibleMonth: previousMonth(state.visibleMonth),
      direction: -1,
    })),
  goToNextMonth: () =>
    set((state) => ({
      visibleMonth: nextMonth(state.visibleMonth),
      direction: 1,
    })),
  goToToday: () => {
    const currentMonth = get().visibleMonth;
    const today = startOfMonth(new Date());
    const direction = today >= currentMonth ? 1 : -1;
    set({ visibleMonth: today, direction });
  },
  setVisibleMonth: (date, direction) =>
    set((state) => {
      const nextVisibleMonth = startOfMonth(date);
      return {
        visibleMonth: nextVisibleMonth,
        direction: direction ?? (nextVisibleMonth >= state.visibleMonth ? 1 : -1),
      };
    }),
  setRequestedDate: (date) => set({ requestedDate: date }),
}));
