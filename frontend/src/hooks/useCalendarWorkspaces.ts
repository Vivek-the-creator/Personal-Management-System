import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarRepository } from "@/db/repositories/calendarRepository";
import { syncRepository } from "@/db/repositories/syncRepository";
import { useCalendarWorkspaceStore, useUserStore } from "@/store";
import { syncEngine, runInitialSync } from "@/sync";
import type { CalendarFormValues, CalendarUpdateBody, CalendarWorkspace } from "@/types";
import type { LocalCalendar } from "@/db";

const calendarsKey = ["calendars"] as const;

function toWorkspace(local: LocalCalendar): CalendarWorkspace {
  return {
    id: local.id,
    name: local.name,
    emoji: local.emoji,
    color: local.color,
    description: local.description,
    isDefault: local.isDefault,
    isVisible: local.isVisible,
    isArchived: local.isArchived,
    createdAt: local.createdAt,
    updatedAt: local.localUpdatedAt,
  };
}

function upsertWorkspace(
  calendars: CalendarWorkspace[] | undefined,
  calendar: CalendarWorkspace
): CalendarWorkspace[] {
  const existing = calendars ?? [];

  // If calendar being inserted is default, mark all others as not default in memory
  const base = calendar.isDefault
    ? existing.map((item) => ({ ...item, isDefault: false }))
    : existing;

  const next = base.some((item) => item.id === calendar.id)
    ? base.map((item) => (item.id === calendar.id ? calendar : item))
    : [calendar, ...base];

  return next.sort((a, b) => Number(a.isArchived) - Number(b.isArchived));
}

export function useCalendarWorkspaces() {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const selectedCalendarId = useCalendarWorkspaceStore((state) => state.selectedCalendarId);
  const setSelectedCalendarId = useCalendarWorkspaceStore((state) => state.setSelectedCalendarId);

  const query = useQuery({
    queryKey: calendarsKey,
    queryFn: async () => {
      if (!user?.id) return [];
      let locals = await calendarRepository.listAll(user.id);

      // If user has 0 local calendars, check if initial sync needs to run first
      if (locals.length === 0) {
        const isDone = await syncRepository.isInitialSyncDone();
        if (!isDone && typeof navigator !== "undefined" && navigator.onLine) {
          await runInitialSync({ userId: user.id }).catch(() => {});
          locals = await calendarRepository.listAll(user.id);
        }
      }

      // Create default local calendar if user STILL has 0 calendars after initial sync
      if (locals.length === 0) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const defaultCal: LocalCalendar = {
          id,
          userId: user.id,
          name: "My Calendar",
          emoji: "⭐",
          color: "sky",
          isDefault: true,
          isVisible: true,
          isArchived: false,
          createdAt: now,
          localUpdatedAt: now,
          serverUpdatedAt: null,
          syncStatus: "pending",
          deletedAt: null,
        };
        await calendarRepository.upsert(defaultCal);
        await syncRepository.enqueue({
          operationId: crypto.randomUUID(),
          operation: "CREATE_CALENDAR",
          entityId: id,
          payload: {
            name: "My Calendar",
            emoji: "⭐",
            color: "sky",
            isDefault: true,
          },
        });
        syncEngine.trigger("create-default-calendar");
        return [toWorkspace(defaultCal)];
      }

      return locals.map(toWorkspace);
    },
    enabled: !!user?.id,
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
    mutationFn: async (body: CalendarFormValues) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Enforce unique calendar name
      const nameExists = await calendarRepository.existsByName(user.id, body.name);
      if (nameExists) {
        throw new Error("A calendar with this name already exists");
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const local: LocalCalendar = {
        id,
        userId: user.id,
        name: body.name.trim(),
        emoji: body.emoji,
        color: body.color,
        description: body.description?.trim(),
        isDefault: body.isDefault ?? false,
        isVisible: true,
        isArchived: false,
        createdAt: now,
        localUpdatedAt: now,
        serverUpdatedAt: null,
        syncStatus: "pending",
        deletedAt: null,
      };

      await calendarRepository.upsert(local);
      if (local.isDefault) {
        await calendarRepository.clearDefaultsExcept(user.id, id);
      }

      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "CREATE_CALENDAR",
        entityId: id,
        payload: body as unknown as Record<string, unknown>,
      });

      syncEngine.trigger("create-calendar");
      return toWorkspace(local);
    },
    onSuccess: (calendar) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        upsertWorkspace(old, calendar)
      );
      setSelectedCalendarId(calendar.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: CalendarUpdateBody }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const existing = await calendarRepository.getById(id);
      if (!existing) throw new Error("Calendar not found");

      // Enforce unique calendar name if name is changing
      if (body.name && body.name.trim().toLowerCase() !== existing.name.trim().toLowerCase()) {
        const nameExists = await calendarRepository.existsByName(user.id, body.name, id);
        if (nameExists) {
          throw new Error("A calendar with this name already exists");
        }
      }

      const now = new Date().toISOString();
      const updated: LocalCalendar = {
        ...existing,
        ...body,
        ...(body.name && { name: body.name.trim() }),
        localUpdatedAt: now,
        syncStatus: "pending",
      };

      await calendarRepository.upsert(updated);
      if (body.isDefault) {
        await calendarRepository.clearDefaultsExcept(user.id, id);
      }

      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "UPDATE_CALENDAR",
        entityId: id,
        payload: body as unknown as Record<string, unknown>,
      });

      syncEngine.trigger("update-calendar");
      return toWorkspace(updated);
    },
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
            : body.isDefault
            ? { ...calendar, isDefault: false }
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
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      await calendarRepository.softDelete(id, user.id);
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "DELETE_CALENDAR",
        entityId: id,
        payload: {},
      });

      syncEngine.trigger("delete-calendar");
    },
    onSuccess: (_result, id) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        old?.filter((calendar) => calendar.id !== id)
      );
      if (selectedCalendarId === id) setSelectedCalendarId(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = await calendarRepository.getById(id);
      if (!existing) throw new Error("Calendar not found");
      const now = new Date().toISOString();
      const updated: LocalCalendar = { ...existing, isArchived: true, isVisible: false, localUpdatedAt: now, syncStatus: "pending" };
      await calendarRepository.upsert(updated);
      await syncRepository.enqueue({ operationId: crypto.randomUUID(), operation: "UPDATE_CALENDAR", entityId: id, payload: { isArchived: true, isVisible: false } });
      syncEngine.trigger("archive-calendar");
      return toWorkspace(updated);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = await calendarRepository.getById(id);
      if (!existing) throw new Error("Calendar not found");
      const now = new Date().toISOString();
      const updated: LocalCalendar = { ...existing, isArchived: false, isVisible: true, localUpdatedAt: now, syncStatus: "pending" };
      await calendarRepository.upsert(updated);
      await syncRepository.enqueue({ operationId: crypto.randomUUID(), operation: "UPDATE_CALENDAR", entityId: id, payload: { isArchived: false, isVisible: true } });
      syncEngine.trigger("restore-calendar");
      return toWorkspace(updated);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const existing = await calendarRepository.getById(id);
      if (!existing) throw new Error("Calendar not found");

      const now = new Date().toISOString();
      const updated: LocalCalendar = {
        ...existing,
        isDefault: true,
        isVisible: true,
        localUpdatedAt: now,
        syncStatus: "pending",
      };

      await calendarRepository.upsert(updated);
      await calendarRepository.clearDefaultsExcept(user.id, id);

      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "UPDATE_CALENDAR",
        entityId: id,
        payload: { isDefault: true, isVisible: true },
      });

      syncEngine.trigger("set-default-calendar");
      return toWorkspace(updated);
    },
    onSuccess: (calendar) => {
      queryClient.setQueryData<CalendarWorkspace[]>(calendarsKey, (old) =>
        upsertWorkspace(old, calendar)
      );
      setSelectedCalendarId(calendar.id);
    },
    onSettled: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const calendar = await calendarRepository.getById(id);
      if (!calendar) throw new Error("Calendar not found");

      const baseName = `${calendar.name} Copy`.slice(0, 50);
      let name = baseName;
      let suffix = 2;

      while (await calendarRepository.existsByName(user.id, name)) {
        const suffixText = ` ${suffix}`;
        name = `${baseName.slice(0, 50 - suffixText.length)}${suffixText}`;
        suffix += 1;
      }

      return createMutation.mutateAsync({
        name,
        emoji: calendar.emoji,
        color: calendar.color,
        description: calendar.description,
        isDefault: false,
      });
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
    setDefaultCalendar: (id: string) => setDefaultMutation.mutateAsync(id),
    duplicateCalendar: (id: string) => duplicateMutation.mutateAsync(id),
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      archiveMutation.isPending ||
      restoreMutation.isPending ||
      setDefaultMutation.isPending ||
      duplicateMutation.isPending,
  };
}
