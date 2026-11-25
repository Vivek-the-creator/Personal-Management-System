import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventRepository } from "@/db/repositories/eventRepository";
import { syncRepository } from "@/db/repositories/syncRepository";
import { useCalendarWorkspaceStore, useUserStore } from "@/store";
import { syncEngine } from "@/sync";
import type { EventFormValues, EventItem } from "@/types";
import type { LocalEvent } from "@/db";

function toEventItem(local: LocalEvent): EventItem {
  return {
    id: local.id,
    calendarId: local.calendarId,
    title: local.title,
    description: local.description,
    emoji: local.emoji,
    highlightColor: local.highlightColor,
    highlightStyle: local.highlightStyle as any,
    startAt: local.startAt,
    endAt: local.endAt,
    isAllDay: local.isAllDay,
    location: local.location,
    priority: local.priority as any,
    recurrenceRule: local.recurrenceRule,
    recurrenceEnd: local.recurrenceEnd,
    createdAt: local.createdAt,
    updatedAt: local.localUpdatedAt,
  };
}

async function getEffectiveUserId(storeUserId?: string): Promise<string> {
  if (storeUserId) return storeUserId;
  const synced = await syncRepository.getSyncedUserId();
  if (synced) return synced;
  return "offline-user";
}

export function useEvents(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const selectedCalendarId = useCalendarWorkspaceStore((state) => state.selectedCalendarId);

  const queryKey = useMemo(
    () => ["events", selectedCalendarId, startDate, endDate] as const,
    [selectedCalendarId, startDate, endDate]
  );

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const userId = await getEffectiveUserId(user?.id);
      const locals = await eventRepository.listByDateRange(
        userId,
        selectedCalendarId,
        startDate,
        endDate
      );
      return locals.map(toEventItem);
    },
    enabled: true,
  });

  const events = query.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const createMutation = useMutation({
    mutationFn: async (body: EventFormValues) => {
      const userId = await getEffectiveUserId(user?.id);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const localEvent: LocalEvent = {
        id,
        userId,
        calendarId: body.calendarId,
        title: body.title,
        description: body.description,
        emoji: body.emoji,
        highlightColor: body.highlightColor ?? "#7C3AED",
        highlightStyle: body.highlightStyle ?? "background",
        startAt: body.startAt,
        endAt: body.endAt,
        isAllDay: body.isAllDay ?? true,
        location: body.location,
        priority: body.priority ?? "medium",
        recurrenceRule: body.recurrenceRule,
        recurrenceEnd: body.recurrenceEnd,
        createdAt: now,
        localUpdatedAt: now,
        serverUpdatedAt: null,
        syncStatus: "pending",
        deletedAt: null,
      };

      // 1. Save to IndexedDB immediately
      await eventRepository.upsert(localEvent);

      // 2. Queue sync operation
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "CREATE_EVENT",
        entityId: id,
        payload: {
          calendarId: body.calendarId,
          title: body.title,
          description: body.description,
          emoji: body.emoji,
          highlightColor: body.highlightColor,
          highlightStyle: body.highlightStyle,
          startAt: body.startAt,
          endAt: body.endAt,
          isAllDay: body.isAllDay,
          location: body.location,
          priority: body.priority,
          recurrenceRule: body.recurrenceRule,
          recurrenceEnd: body.recurrenceEnd,
        },
      });

      // 3. Trigger sync in background
      syncEngine.trigger("create-event");

      return toEventItem(localEvent);
    },
    onSuccess: (newEvent) => {
      queryClient.setQueryData<EventItem[]>(queryKey, (old = []) => [...old, newEvent]);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<EventFormValues> }) => {
      const existing = await eventRepository.getById(id);
      if (!existing) throw new Error("Event not found");

      const now = new Date().toISOString();
      const updatedLocal: LocalEvent = {
        ...existing,
        ...body,
        localUpdatedAt: now,
        syncStatus: "pending",
      };

      // 1. Update IndexedDB immediately
      await eventRepository.upsert(updatedLocal);

      // 2. Queue sync operation
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "UPDATE_EVENT",
        entityId: id,
        payload: body,
      });

      // 3. Trigger sync
      syncEngine.trigger("update-event");

      return toEventItem(updatedLocal);
    },
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EventItem[]>(queryKey);

      queryClient.setQueryData<EventItem[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === id ? ({ ...item, ...body } as EventItem) : item))
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
    mutationFn: async (id: string) => {
      const userId = await getEffectiveUserId(user?.id);

      // 1. Soft-delete locally
      await eventRepository.softDelete(id, userId);

      // 2. Queue delete operation
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "DELETE_EVENT",
        entityId: id,
        payload: {},
      });

      // 3. Trigger sync
      syncEngine.trigger("delete-event");
    },
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
