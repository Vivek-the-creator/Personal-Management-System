import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  recentSearchHistory,
  searchRepository,
} from "@/db/repositories/searchRepository";
import { syncRepository } from "@/db/repositories/syncRepository";
import { useUserStore } from "@/store";
import type {
  SearchCategory,
  SearchTimeHorizon,
} from "@/types/search.types";

async function getEffectiveUserId(storeUserId?: string): Promise<string> {
  if (storeUserId) return storeUserId;
  const synced = await syncRepository.getSyncedUserId();
  if (synced) return synced;
  return "offline-user";
}

const DEFAULT_PAGE_SIZE = 20;

export function useGlobalSearch(initialCalendarId: string | null = null) {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [timeHorizon, setTimeHorizon] = useState<SearchTimeHorizon>("all");
  const [calendarId, setCalendarId] = useState<string | null>(initialCalendarId);
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounce input by 180ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setLimit(DEFAULT_PAGE_SIZE);
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Load local recent search history
  useEffect(() => {
    let active = true;
    getEffectiveUserId(user?.id).then((uid) => {
      if (active) {
        setRecentSearches(recentSearchHistory.get(uid));
      }
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const hasActiveFilter =
    category !== "all" ||
    timeHorizon !== "all" ||
    Boolean(calendarId) ||
    Boolean(customStartDate) ||
    Boolean(customEndDate);

  const shouldSearch = debouncedQuery.trim().length > 0 || hasActiveFilter;

  const searchQueryKey = useMemo(
    () =>
      [
        "global-search",
        user?.id,
        debouncedQuery,
        category,
        timeHorizon,
        calendarId,
        customStartDate,
        customEndDate,
        limit,
      ] as const,
    [
      user?.id,
      debouncedQuery,
      category,
      timeHorizon,
      calendarId,
      customStartDate,
      customEndDate,
      limit,
    ]
  );

  const searchQuery = useQuery({
    queryKey: searchQueryKey,
    enabled: shouldSearch,
    queryFn: async ({ signal }) => {
      const uid = await getEffectiveUserId(user?.id);
      return searchRepository.search(
        uid,
        {
          query: debouncedQuery,
          category,
          timeHorizon,
          calendarId,
          customStartDate,
          customEndDate,
          limit,
        },
        signal
      );
    },
  });

  const suggestionsQuery = useQuery({
    queryKey: ["global-search-suggestions", user?.id] as const,
    enabled: !shouldSearch,
    queryFn: async () => {
      const uid = await getEffectiveUserId(user?.id);
      return searchRepository.getSuggestions(uid);
    },
  });

  const saveSearchToHistory = useCallback(
    async (term?: string) => {
      const target = (term ?? query).trim();
      if (!target) return;
      const uid = await getEffectiveUserId(user?.id);
      setRecentSearches(recentSearchHistory.add(uid, target));
    },
    [query, user?.id]
  );

  const removeRecentSearch = useCallback(
    async (term: string) => {
      const uid = await getEffectiveUserId(user?.id);
      setRecentSearches(recentSearchHistory.remove(uid, term));
    },
    [user?.id]
  );

  const clearRecentSearches = useCallback(async () => {
    const uid = await getEffectiveUserId(user?.id);
    recentSearchHistory.clear(uid);
    setRecentSearches([]);
  }, [user?.id]);

  const loadMore = useCallback(() => {
    setLimit((prev) => prev + DEFAULT_PAGE_SIZE);
  }, []);

  const resetFilters = useCallback(() => {
    setCategory("all");
    setTimeHorizon("all");
    setCalendarId(null);
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    setLimit(DEFAULT_PAGE_SIZE);
  }, []);

  const clearAll = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    resetFilters();
  }, [resetFilters]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["global-search"] });
    queryClient.invalidateQueries({ queryKey: ["global-search-suggestions"] });
  }, [queryClient]);

  return {
    query,
    setQuery,
    debouncedQuery,
    category,
    setCategory,
    timeHorizon,
    setTimeHorizon,
    calendarId,
    setCalendarId,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    hasActiveFilter,
    shouldSearch,
    results: searchQuery.data,
    isSearching: shouldSearch && (searchQuery.isLoading || searchQuery.isFetching),
    searchError: searchQuery.error,
    suggestions: suggestionsQuery.data,
    suggestionsLoading: !shouldSearch && suggestionsQuery.isLoading,
    recentSearches,
    saveSearchToHistory,
    removeRecentSearch,
    clearRecentSearches,
    loadMore,
    resetFilters,
    clearAll,
    invalidate,
  };
}
