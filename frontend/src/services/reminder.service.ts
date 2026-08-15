import { apiClient } from "@/lib/api-client";
import type { ApiResponse, ReminderItem } from "@/types";

export async function getReminders(eventId?: string): Promise<ReminderItem[]> {
  const url = `/reminders${eventId ? `?eventId=${eventId}` : ""}`;
  const res = await apiClient.get<ApiResponse<ReminderItem[]>>(url);
  return res.data ?? [];
}

export async function createReminder(body: {
  eventId: string;
  type?: string;
  scheduledAt: string;
  timezone?: string;
  enabled?: boolean;
}): Promise<ReminderItem> {
  const res = await apiClient.post<ApiResponse<ReminderItem>>("/reminders", body);
  if (!res.data) throw new Error("Empty response when creating reminder");
  return res.data;
}

export async function updateReminder(
  id: string,
  body: {
    type?: string;
    scheduledAt?: string;
    timezone?: string;
    enabled?: boolean;
    status?: string;
  }
): Promise<ReminderItem> {
  const res = await apiClient.put<ApiResponse<ReminderItem>>(`/reminders/${id}`, body);
  if (!res.data) throw new Error("Empty response when updating reminder");
  return res.data;
}

export async function deleteReminder(id: string): Promise<void> {
  await apiClient.delete(`/reminders/${id}`);
}
