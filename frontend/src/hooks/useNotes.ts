import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { noteRepository } from "@/db/repositories/noteRepository";
import { syncRepository } from "@/db/repositories/syncRepository";
import { useUserStore } from "@/store";
import { syncEngine } from "@/sync";
import type { CreateNoteValues, NoteItem, UpdateNoteValues } from "@/types";
import type { LocalNote } from "@/db";

function toNoteItem(local: LocalNote): NoteItem {
  return {
    id: local.id,
    calendarId: local.calendarId,
    title: local.title,
    content: local.content,
    date: local.date,
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

export function useNotes(startDate?: string, endDate?: string, date?: string) {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);

  const queryKey = useMemo(
    () => ["notes", startDate, endDate, date] as const,
    [startDate, endDate, date]
  );

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const userId = await getEffectiveUserId(user?.id);
      const locals = await noteRepository.listByDateRange(
        userId,
        startDate,
        endDate,
        date
      );
      return locals.map(toNoteItem);
    },
    enabled: true,
  });

  const notes = query.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes"] });

  const createMutation = useMutation({
    mutationFn: async (body: CreateNoteValues) => {
      const userId = await getEffectiveUserId(user?.id);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const localNote: LocalNote = {
        id,
        userId,
        calendarId: body.calendarId,
        title: body.title,
        content: body.content,
        date: body.date,
        createdAt: now,
        localUpdatedAt: now,
        serverUpdatedAt: null,
        syncStatus: "pending",
        deletedAt: null,
      };

      // 1. Immediate local save
      await noteRepository.upsert(localNote);

      // 2. Queue sync
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "CREATE_NOTE",
        entityId: id,
        payload: body as unknown as Record<string, unknown>,
      });

      // 3. Trigger sync engine
      syncEngine.trigger("create-note");

      return toNoteItem(localNote);
    },
    onSuccess: (newNote) => {
      queryClient.setQueryData<NoteItem[]>(queryKey, (old = []) => [newNote, ...old]);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateNoteValues }) => {
      const existing = await noteRepository.getById(id);
      if (!existing) throw new Error("Note not found");

      const now = new Date().toISOString();
      const updatedLocal: LocalNote = {
        ...existing,
        ...body,
        localUpdatedAt: now,
        syncStatus: "pending",
      };

      // 1. Immediate local update
      await noteRepository.upsert(updatedLocal);

      // 2. Queue sync
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "UPDATE_NOTE",
        entityId: id,
        payload: body as unknown as Record<string, unknown>,
      });

      // 3. Trigger sync engine
      syncEngine.trigger("update-note");

      return toNoteItem(updatedLocal);
    },
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NoteItem[]>(queryKey);

      queryClient.setQueryData<NoteItem[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === id ? ({ ...item, ...body } as NoteItem) : item))
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
      if (!user?.id) throw new Error("User not authenticated");

      // 1. Local soft delete
      await noteRepository.softDelete(id);

      // 2. Queue sync
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "DELETE_NOTE",
        entityId: id,
        payload: {},
      });

      // 3. Trigger sync engine
      syncEngine.trigger("delete-note");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NoteItem[]>(queryKey);

      queryClient.setQueryData<NoteItem[]>(queryKey, (old = []) =>
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
    notes,
    createNote: (body: CreateNoteValues) => createMutation.mutateAsync(body),
    updateNote: (id: string, body: UpdateNoteValues) =>
      updateMutation.mutateAsync({ id, body }),
    deleteNote: (id: string) => deleteMutation.mutateAsync(id),
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
