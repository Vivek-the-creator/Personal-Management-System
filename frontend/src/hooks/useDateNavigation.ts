import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/app.constants";
import { useCalendarStore, useCalendarWorkspaceStore } from "@/store";
import { parseLocalDateInput } from "@/utils/date-calculator.utils";

/**
 * Reusable smart date navigation hook.
 * Reuses existing CalendarStore (`setVisibleMonth`, `setRequestedDate`, `goToToday`)
 * and React Router navigation so mobile & desktop behave identically.
 */
export function useDateNavigation() {
  const navigate = useNavigate();
  const setVisibleMonth = useCalendarStore((s) => s.setVisibleMonth);
  const setRequestedDate = useCalendarStore((s) => s.setRequestedDate);
  const goToTodayStore = useCalendarStore((s) => s.goToToday);
  const setSelectedCalendarId = useCalendarWorkspaceStore(
    (s) => s.setSelectedCalendarId
  );

  const jumpToDate = useCallback(
    (dateInput: Date | string, calendarId?: string) => {
      const localDate = parseLocalDateInput(dateInput);
      const target = new Date(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        12,
        0,
        0
      );
      if (calendarId) {
        setSelectedCalendarId(calendarId);
      }
      setVisibleMonth(target);
      setRequestedDate(target);
      navigate(ROUTES.CALENDAR);
    },
    [navigate, setRequestedDate, setSelectedCalendarId, setVisibleMonth]
  );

  const jumpToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    goToTodayStore();
    setRequestedDate(today);
    navigate(ROUTES.CALENDAR);
  }, [goToTodayStore, navigate, setRequestedDate]);

  return {
    jumpToDate,
    jumpToToday,
  };
}
