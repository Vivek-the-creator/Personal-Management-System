import { useMemo } from "react";
import { useAppSettingsStore, useCalendarStore } from "@/store";
import { formatMonthTitle, generateMonth, WEEKDAY_LABELS } from "@/utils/calendar";

export function useCalendarEngine() {
  const weekStartsOn = useAppSettingsStore((state) => state.weekStartsOn);
  const visibleMonth = useCalendarStore((state) => state.visibleMonth);
  const direction = useCalendarStore((state) => state.direction);
  const goToPreviousMonth = useCalendarStore((state) => state.goToPreviousMonth);
  const goToNextMonth = useCalendarStore((state) => state.goToNextMonth);
  const goToToday = useCalendarStore((state) => state.goToToday);
  const setVisibleMonth = useCalendarStore((state) => state.setVisibleMonth);

  const month = useMemo(
    () => generateMonth(visibleMonth, weekStartsOn),
    [visibleMonth, weekStartsOn]
  );

  return {
    month,
    monthTitle: formatMonthTitle(visibleMonth),
    weekdayLabels: WEEKDAY_LABELS[weekStartsOn],
    visibleMonth,
    direction,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setVisibleMonth,
  };
}
