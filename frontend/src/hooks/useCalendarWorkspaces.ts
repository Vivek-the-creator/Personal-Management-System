import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveCalendar,
  createCalendar,
  deleteCalendar,
  duplicateCalendar,
  getCalendars,
  restoreCalendar,
  setDefaultCalendar,
  updateCalendar,
} from "@/services/calendar.service";
import { useCalendarWorkspaceStore } from "@/store";
import type { CalendarFormValues, CalendarUpdateBody, CalendarWorkspace } from "@/types";

const calendarsKey = ["calendars"] as const;

function upsertCalendar(
  calendars: CalendarWorkspace[] | undefined,
  calendar: CalendarWorkspace
): CalendarWorkspace[] {
  const existing = calendars ?? [];
  const next = existing.some((item) => item.id === calendar.id)
    ? existing.map((item) => (item.id === calendar.id ? calendar : item))
    : [calendar, ...existing];

  return next.sort((a, b) => Number(a.isArchived) - Number(b.isArchived));
}

export function useCalendarWorkspaces() {
  const queryClient = useQueryClient();
  const selectedCalendarId = useCalendarWorkspaceStore((state) => state.selectedCalendarId);
  const setSelectedCalendarId = useCalendarWorkspaceStore((state) => state.setSelectedCalendarId);

  const query = useQuery({
    queryKey: calendarsKey,
    queryFn: getCalendars,
  });

  const calendars = query.data ?? [];
  const activeCalendars = useMemo(
    () => calendars.filter((calendar) => !calendar.isArchived),
    [calendars]
  );
  const visibleCalendars = useMemo(
    () => activeCalendars.filter((calendar) => calendar.isVisible),
    [activeCalendars]
  );
  const archivedCalendars = useMemo(
    () => calendars.filter((calendar) => calendar.isArchived),
    [calendars]
  );
  const selectedCalendar = useMemo(
    () =>
      activeCalendars.find((calendar) => calendar.id === selectedCalendarId) ??
      activeCalendars.find((calendar) => calendar.isDefault) ??
      activeCalendars[0] ??
      null,
    [activeCalendars, selectedCalendarId]
  );

  useEffect(() => {
    if (selectedCalendar && selectedCalendar.id !== selectedCalendarId) {
      setSelectedCalendarId(selectedCalendar.id);
    }
  }, [selectedCalendar, selectedCalendarId, setSelectedCalendarId]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: calendarsKey });

  const createMutation = useMutation({
    mutationFn: createCalendar,
    onSuccess: (calendar) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        upsertCalendar(old, calendar)
      );
      setSelectedCalendarId(calendar.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CalendarUpdateBody }) =>
      updateCalendar(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: calendarsKey });
      const previous = queryClient.getQueryData<CalendarWorkspace[]>(calendarsKey);
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        old?.map((calendar) =>
          calendar.id === id
            ? {
                ...calendar,
                ...body,
                updatedAt: new Date().toISOString(),
              }
            : calendar
        )
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(calendarsKey, context?.previous);
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalendar,
    onSuccess: (_result, id) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        old?.filter((calendar) => calendar.id !== id)
      );
      if (selectedCalendarId === id) setSelectedCalendarId(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveCalendar,
    onSuccess: (calendar) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        upsertCalendar(old, calendar)
      );
      if (selectedCalendarId === calendar.id) setSelectedCalendarId(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreCalendar,
    onSuccess: (calendar) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        upsertCalendar(old, calendar)
      );
      setSelectedCalendarId(calendar.id);
    },
  });

  const defaultMutation = useMutation({
    mutationFn: setDefaultCalendar,
    onSuccess: (calendar) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        old?.map((item) => ({
          ...item,
          isDefault: item.id === calendar.id,
          isVisible: item.id === calendar.id ? true : item.isVisible,
        }))
      );
      setSelectedCalendarId(calendar.id);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateCalendar,
    onSuccess: (calendar) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        upsertCalendar(old, calendar)
      );
      setSelectedCalendarId(calendar.id);
    },
  });

  return {
    ...query,
    calendars,
    activeCalendars,
    visibleCalendars,
    archivedCalendars,
    selectedCalendar,
    selectedCalendarId,
    setSelectedCalendarId,
    createCalendar: (body: CalendarFormValues) => createMutation.mutateAsync(body),
    updateCalendar: (id: string, body: CalendarUpdateBody) =>
      updateMutation.mutateAsync({ id, body }),
    deleteCalendar: (id: string) => deleteMutation.mutateAsync(id),
    archiveCalendar: (id: string) => archiveMutation.mutateAsync(id),
    restoreCalendar: (id: string) => restoreMutation.mutateAsync(id),
    setDefaultCalendar: (id: string) => defaultMutation.mutateAsync(id),
    duplicateCalendar: (id: string) => duplicateMutation.mutateAsync(id),
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      archiveMutation.isPending ||
      restoreMutation.isPending ||
      defaultMutation.isPending ||
      duplicateMutation.isPending,
  };
}
