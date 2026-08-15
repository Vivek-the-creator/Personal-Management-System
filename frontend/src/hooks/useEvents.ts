import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, deleteEvent, getEvents, updateEvent } from "@/services/event.service";
import { useCalendarWorkspaceStore } from "@/store";
import type { EventFormValues, EventItem } from "@/types";

export function useEvents(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();
  const selectedCalendarId = useCalendarWorkspaceStore((state) => state.selectedCalendarId);

  const queryKey = useMemo(
    () => ["events", selectedCalendarId, startDate, endDate] as const,
    [selectedCalendarId, startDate, endDate]
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      getEvents({
        calendarId: selectedCalendarId ?? undefined,
        startDate,
        endDate,
      }),
  });

  const events = query.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (newEvent) => {
      queryClient.setQueryData<EventItem[]>(queryKey, (old = []) => [...old, newEvent]);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<EventFormValues> }) =>
      updateEvent(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EventItem[]>(queryKey);

      queryClient.setQueryData<EventItem[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === id ? { ...item, ...body } as EventItem : item))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EventItem[]>(queryKey);

      queryClient.setQueryData<EventItem[]>(queryKey, (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  return {
    ...query,
    events,
    createEvent: (body: EventFormValues) => createMutation.mutateAsync(body),
    updateEvent: (id: string, body: Partial<EventFormValues>) =>
      updateMutation.mutateAsync({ id, body }),
    deleteEvent: (id: string) => deleteMutation.mutateAsync(id),
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
