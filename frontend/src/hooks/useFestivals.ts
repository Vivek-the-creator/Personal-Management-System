import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ALL_FESTIVALS } from "@/data/festivals";
import { festivalRepository } from "@/db/repositories/festivalRepository";
import type {
  FestivalFilters,
  FestivalRecord,
  FestivalSettings,
} from "@/types/festival.types";
import {
  DEFAULT_FESTIVAL_SETTINGS,
  filterFestivals,
  groupFestivalsByDate,
} from "@/utils/festival.utils";

const FESTIVAL_SETTINGS_QUERY_KEY = ["festival-settings"] as const;
const FESTIVALS_QUERY_KEY = ["festivals"] as const;

export function useFestivalSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: FESTIVAL_SETTINGS_QUERY_KEY,
    queryFn: () => festivalRepository.getSettings(),
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: (partial: Partial<FestivalSettings>) =>
      festivalRepository.saveSettings(partial),
    onSuccess: (updated) => {
      queryClient.setQueryData(FESTIVAL_SETTINGS_QUERY_KEY, updated);
    },
  });

  return {
    festivalSettings: query.data ?? DEFAULT_FESTIVAL_SETTINGS,
    isLoading: query.isLoading,
    updateFestivalSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

/**
 * Offline-first hook for querying festivals from Dexie.js IndexedDB,
 * automatically seeded on first access and filtered by user preferences.
 */
export function useFestivals(
  filters: FestivalFilters = {},
  options: { ignoreSettings?: boolean } = {}
) {
  const { festivalSettings } = useFestivalSettings();

  const query = useQuery({
    queryKey: [...FESTIVALS_QUERY_KEY, filters.year ?? "all"],
    queryFn: async () => {
      await festivalRepository.seedIfNeeded(ALL_FESTIVALS);
      if (filters.year !== undefined) {
        return festivalRepository.listByYear(filters.year);
      }
      return festivalRepository.listAll();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (reference data)
  });

  const festivals = useMemo<FestivalRecord[]>(() => {
    const raw = query.data ?? [];
    return filterFestivals(
      raw,
      {
        year: filters.year,
        month: filters.month,
        category: filters.category,
        region: filters.region,
        dateStart: filters.dateStart,
        dateEnd: filters.dateEnd,
      },
      options.ignoreSettings ? undefined : festivalSettings
    );
  }, [
    query.data,
    filters.year,
    filters.month,
    filters.category,
    filters.region,
    filters.dateStart,
    filters.dateEnd,
    options.ignoreSettings,
    festivalSettings,
  ]);

  const festivalsByDate = useMemo(
    () => groupFestivalsByDate(festivals),
    [festivals]
  );

  return {
    festivals,
    festivalsByDate,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

