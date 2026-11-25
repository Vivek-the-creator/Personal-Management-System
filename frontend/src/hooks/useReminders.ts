import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reminderRepository } from "@/db/repositories/reminderRepository";
import { syncRepository } from "@/db/repositories/syncRepository";
import { useUserStore } from "@/store";
import { syncEngine } from "@/sync";
import type { CreateReminderBody, ReminderItem, UpdateReminderBody } from "@/types";
import type { LocalReminder } from "@/db";

function toReminderDTO(local: LocalReminder): ReminderItem {
  return {
    id: local.id,
    eventId: local.eventId,
    type: local.type,
    scheduledAt: local.scheduledAt,
    timezone: local.timezone,
    enabled: local.enabled,
    status: local.status,
    sentAt: local.sentAt ?? undefined,
    createdAt: local.createdAt,
    updatedAt: local.localUpdatedAt,
  };
}

export function useReminders(eventId?: string) {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const queryKey = ["reminders", eventId] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!eventId) return [];
      const locals = await reminderRepository.listByEventId(eventId);
      return locals.map(toReminderDTO);
    },
    enabled: !!eventId,
  });

  const reminders = query.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reminders", eventId] });

  const createMut = useMutation({
    mutationFn: async (body: CreateReminderBody) => {
      if (!user?.id) throw new Error("Not authenticated");

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const local: LocalReminder = {
        id,
        userId: user.id,
        eventId: body.eventId,
        type: body.type ?? "start_of_day",
        scheduledAt: body.scheduledAt,
        timezone: body.timezone ?? "UTC",
        enabled: body.enabled ?? true,
        status: "PENDING",
        sentAt: null,
        createdAt: now,
        localUpdatedAt: now,
        serverUpdatedAt: null,
        syncStatus: "pending",
      };

      await reminderRepository.upsert(local);

      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "CREATE_REMINDER",
        entityId: id,
        payload: body as unknown as Record<string, unknown>,
      });

      syncEngine.trigger("create-reminder");
      return toReminderDTO(local);
    },
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateReminderBody }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const existing = await reminderRepository.getById(id);
      if (!existing) throw new Error("Reminder not found");

      const now = new Date().toISOString();
      const updated: LocalReminder = {
        ...existing,
        ...body,
        localUpdatedAt: now,
        syncStatus: "pending",
      };

      await reminderRepository.upsert(updated);

      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "UPDATE_REMINDER",
        entityId: id,
        payload: body as unknown as Record<string, unknown>,
      });

      syncEngine.trigger("update-reminder");
      return toReminderDTO(updated);
    },
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      await reminderRepository.delete(id);

      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "DELETE_REMINDER",
        entityId: id,
        payload: {},
      });

      syncEngine.trigger("delete-reminder");
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    reminders,
    createReminder: createMut.mutateAsync,
    updateReminder: updateMut.mutateAsync,
    deleteReminder: deleteMut.mutateAsync,
  };
}
