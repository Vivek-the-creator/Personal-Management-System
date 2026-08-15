import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CalendarFormValues,
  CalendarUpdateBody,
  CalendarWorkspace,
} from "@/types";

export async function getCalendars(): Promise<CalendarWorkspace[]> {
  const res = await apiClient.get<ApiResponse<CalendarWorkspace[]>>("/calendars");
  if (!res.data) throw new Error("Empty calendars response");
  return res.data;
}

export async function createCalendar(body: CalendarFormValues): Promise<CalendarWorkspace> {
  const res = await apiClient.post<ApiResponse<CalendarWorkspace>>("/calendars", body);
  if (!res.data) throw new Error("Empty calendar response");
  return res.data;
}

export async function updateCalendar(
  id: string,
  body: CalendarUpdateBody
): Promise<CalendarWorkspace> {
  const res = await apiClient.put<ApiResponse<CalendarWorkspace>>(`/calendars/${id}`, body);
  if (!res.data) throw new Error("Empty calendar response");
  return res.data;
}

export async function deleteCalendar(id: string): Promise<void> {
  await apiClient.delete<ApiResponse>(`/calendars/${id}`);
}

export async function archiveCalendar(id: string): Promise<CalendarWorkspace> {
  const res = await apiClient.post<ApiResponse<CalendarWorkspace>>(`/calendars/${id}/archive`);
  if (!res.data) throw new Error("Empty calendar response");
  return res.data;
}

export async function restoreCalendar(id: string): Promise<CalendarWorkspace> {
  const res = await apiClient.post<ApiResponse<CalendarWorkspace>>(`/calendars/${id}/restore`);
  if (!res.data) throw new Error("Empty calendar response");
  return res.data;
}

export async function setDefaultCalendar(id: string): Promise<CalendarWorkspace> {
  const res = await apiClient.post<ApiResponse<CalendarWorkspace>>(`/calendars/${id}/default`);
  if (!res.data) throw new Error("Empty calendar response");
  return res.data;
}

export async function duplicateCalendar(id: string): Promise<CalendarWorkspace> {
  const res = await apiClient.post<ApiResponse<CalendarWorkspace>>(`/calendars/${id}/duplicate`);
  if (!res.data) throw new Error("Empty calendar response");
  return res.data;
}
