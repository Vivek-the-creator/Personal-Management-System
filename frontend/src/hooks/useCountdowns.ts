import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/db";
import { syncRepository } from "@/db/repositories/syncRepository";
import { useUserStore } from "@/store";
import { buildUpcomingCountdowns } from "@/utils/date-calculator.utils";

async function getEffectiveUserId(storeUserId?: string): Promise<string> {
  if (storeUserId) return storeUserId;
  const synced = await syncRepository.getSyncedUserId();
  if (synced) return synced;
  return "offline-user";
}

/**
 * Offline-first Event Countdown hook.
 * Uses queryKey prefix ["events", "countdowns", ...] so any event create/edit/delete
 * that invalidates ["events"] immediately updates countdown results.
 */
export function useCountdowns(limit = 25) {
  const user = useUserStore((s) => s.user);

  const query = useQuery({
    queryKey: ["events", "countdowns", user?.id] as const,
    queryFn: async () => {
      const uid = await getEffectiveUserId(user?.id);
      const [events, calendars] = await Promise.all([
        db.events.where("userId").equals(uid).toArray(),
        db.calendars.where("userId").equals(uid).toArray(),
      ]);
      return { events, calendars };
    },
    staleTime: 1000 * 30,
  });

  const countdowns = useMemo(() => {
    if (!query.data) return [];
    return buildUpcomingCountdowns(
      query.data.events,
      query.data.calendars,
      new Date(),
      limit
    );
  }, [query.data, limit]);

  const milestones = useMemo(
    () => countdowns.filter((item) => item.isBirthdayOrAnniversary),
    [countdowns]
  );

  return {
    countdowns,
    milestones,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
