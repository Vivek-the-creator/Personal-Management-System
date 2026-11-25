import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { timelineRepository } from "@/db/repositories/timelineRepository";
import { syncRepository } from "@/db/repositories/syncRepository";
import { useCalendarWorkspaceStore, useUserStore } from "@/store";
import type {
  TimelineFilterType,
  TimelineTimeHorizon,
} from "@/types/timeline.types";
import { buildTimelineGroups } from "@/utils/timeline.utils";
import { dateKey } from "@/utils/calendar";

async function getEffectiveUserId(storeUserId?: string): Promise<string> {
  if (storeUserId) return storeUserId;
  const synced = await syncRepository.getSyncedUserId();
  if (synced) return synced;
  return "offline-user";
}

export function useTimeline() {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);

  // Sync with global workspace store calendar selection
  const globalCalendarId = useCalendarWorkspaceStore((state) => state.selectedCalendarId);
  const setGlobalCalendarId = useCalendarWorkspaceStore((state) => state.setSelectedCalendarId);

  // Local filter states
  const [selectedCalendarId, setSelectedCalendarIdState] = useState<string | null>(globalCalendarId);
  const [typeFilter, setTypeFilter] = useState<TimelineFilterType>("all");
  const [timeHorizon, setTimeHorizon] = useState<TimelineTimeHorizon>("all");
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);

  // Pagination / Dynamic incremental year window
  const currentYear = new Date().getFullYear();
  const [visibleYearStart, setVisibleYearStart] = useState<number>(currentYear - 1);
  const [visibleYearEnd, setVisibleYearEnd] = useState<number>(currentYear + 1);

  // Keep global store in sync when calendar selection changes
  const setSelectedCalendarId = useCallback(
    (id: string | null) => {
      setSelectedCalendarIdState(id);
      setGlobalCalendarId(id);
    },
    [setGlobalCalendarId]
  );

  // 1. Query available years across the archive
  const availableYearsQuery = useQuery({
    queryKey: ["timeline-years", user?.id, selectedCalendarId],
    queryFn: async () => {
      const uid = await getEffectiveUserId(user?.id);
      return timelineRepository.getAvailableYearRange(uid, selectedCalendarId);
    },
  });

  const { minYear = currentYear, maxYear = currentYear, yearsWithData = [currentYear] } =
    availableYearsQuery.data ?? {};

  // 2. Query timeline data within the visible window
  const queryKey = useMemo(
    () =>
      [
        "timeline",
        user?.id,
        selectedCalendarId,
        typeFilter,
        timeHorizon,
        customStartDate,
        customEndDate,
        visibleYearStart,
        visibleYearEnd,
      ] as const,
    [
      user?.id,
      selectedCalendarId,
      typeFilter,
      timeHorizon,
      customStartDate,
      customEndDate,
      visibleYearStart,
      visibleYearEnd,
    ]
  );

  const timelineQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const uid = await getEffectiveUserId(user?.id);

      // Determine date bounds
      const startDate = customStartDate || `${visibleYearStart}-01-01T00:00:00.000Z`;
      const endDate = customEndDate || `${visibleYearEnd}-12-31T23:59:59.999Z`;

      const result = await timelineRepository.getTimelineData(uid, {
        calendarId: selectedCalendarId,
        startDate,
        endDate,
      });

      const yearGroups = buildTimelineGroups({
        events: result.events,
        notes: result.notes,
        calendars: result.calendars,
        typeFilter,
        timeHorizon,
        customStartDate,
        customEndDate,
      });

      const totalEntries = yearGroups.reduce((acc, y) => acc + y.totalEntries, 0);

      return {
        yearGroups,
        totalEntries,
      };
    },
  });

  const yearGroups = timelineQuery.data?.yearGroups ?? [];
  const totalEntries = timelineQuery.data?.totalEntries ?? 0;
  const isLoading = timelineQuery.isLoading;

  // Incremental loading controls
  const loadEarlierYears = useCallback(() => {
    setVisibleYearStart((prev) => prev - 2);
  }, []);

  const loadLaterYears = useCallback(() => {
    setVisibleYearEnd((prev) => prev + 2);
  }, []);

  // Jump navigations with smooth scroll
  const scrollToId = useCallback((id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, []);

  const jumpToYear = useCallback(
    (year: number) => {
      if (year < visibleYearStart) {
        setVisibleYearStart(year);
      }
      if (year > visibleYearEnd) {
        setVisibleYearEnd(year);
      }
      scrollToId(`year-header-${year}`);
    },
    [visibleYearStart, visibleYearEnd, scrollToId]
  );

  const jumpToMonth = useCallback(
    (year: number, month: number) => {
      if (year < visibleYearStart) setVisibleYearStart(year);
      if (year > visibleYearEnd) setVisibleYearEnd(year);
      scrollToId(`month-header-${year}-${month}`);
    },
    [visibleYearStart, visibleYearEnd, scrollToId]
  );

  const jumpToToday = useCallback(() => {
    const today = new Date();
    const curY = today.getFullYear();
    if (curY < visibleYearStart) setVisibleYearStart(curY);
    if (curY > visibleYearEnd) setVisibleYearEnd(curY);

    // If timeHorizon was past or upcoming, reset to "all" so today is visible
    if (timeHorizon === "past" || timeHorizon === "upcoming") {
      setTimeHorizon("all");
    }
    scrollToId("timeline-today-marker");
  }, [visibleYearStart, visibleYearEnd, timeHorizon, scrollToId]);

  const jumpToDate = useCallback(
    (date: Date) => {
      const y = date.getFullYear();
      if (y < visibleYearStart) setVisibleYearStart(y);
      if (y > visibleYearEnd) setVisibleYearEnd(y);
      scrollToId(`date-node-${dateKey(date)}`);
    },
    [visibleYearStart, visibleYearEnd, scrollToId]
  );

  const goToPrevYear = useCallback(() => {
    jumpToYear(visibleYearStart - 1);
  }, [jumpToYear, visibleYearStart]);

  const goToNextYear = useCallback(() => {
    jumpToYear(visibleYearEnd + 1);
  }, [jumpToYear, visibleYearEnd]);

  const resetFilters = useCallback(() => {
    setTypeFilter("all");
    setTimeHorizon("all");
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
  }, []);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["timeline"] });
    queryClient.invalidateQueries({ queryKey: ["timeline-years"] });
  }, [queryClient]);

  return {
    yearGroups,
    totalEntries,
    isLoading,
    // Filters
    selectedCalendarId,
    setSelectedCalendarId,
    typeFilter,
    setTypeFilter,
    timeHorizon,
    setTimeHorizon,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    resetFilters,
    // Window & bounds
    visibleYearStart,
    visibleYearEnd,
    minYear,
    maxYear,
    yearsWithData,
    // Nav actions
    loadEarlierYears,
    loadLaterYears,
    jumpToYear,
    jumpToMonth,
    jumpToToday,
    jumpToDate,
    goToPrevYear,
    goToNextYear,
    invalidate,
  };
}
