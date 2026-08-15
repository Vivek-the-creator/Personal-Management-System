import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReminder, deleteReminder, getReminders, updateReminder } from "@/services/reminder.service";

export function useReminders(eventId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["reminders", eventId] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => getReminders(eventId),
  });

  const reminders = query.data ?? [];

  const createMut = useMutation({
    mutationFn: createReminder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateReminder>[1] }) =>
      updateReminder(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  return {
    ...query,
    reminders,
    createReminder: createMut.mutateAsync,
    updateReminder: updateMut.mutateAsync,
    deleteReminder: deleteMut.mutateAsync,
  };
}
