import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNote, deleteNote, getNotes, updateNote } from "@/services/note.service";
import type { CreateNoteValues, NoteItem, UpdateNoteValues } from "@/types";

export function useNotes(startDate?: string, endDate?: string, date?: string) {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["notes", startDate, endDate, date] as const,
    [startDate, endDate, date]
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      getNotes({
        startDate,
        endDate,
        date,
      }),
  });

  const notes = query.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes"] });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      queryClient.setQueryData<NoteItem[]>(queryKey, (old = []) => [newNote, ...old]);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateNoteValues }) =>
      updateNote(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NoteItem[]>(queryKey);

      queryClient.setQueryData<NoteItem[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === id ? { ...item, ...body } as NoteItem : item))
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
    mutationFn: deleteNote,
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
