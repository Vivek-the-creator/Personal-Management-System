import { apiClient } from "@/lib/api-client";
import type { ApiResponse, EventFormValues, EventItem } from "@/types";

export interface GetEventsParams {
  calendarId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getEvents(params: GetEventsParams = {}): Promise<EventItem[]> {
  const queryParams = new URLSearchParams();
  if (params.calendarId) queryParams.append("calendarId", params.calendarId);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const url = `/events${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<ApiResponse<EventItem[]>>(url);
  return res.data ?? [];
}

export async function createEvent(body: EventFormValues): Promise<EventItem> {
  const res = await apiClient.post<ApiResponse<EventItem>>("/events", body);
  if (!res.data) throw new Error("Empty response when creating event");
  return res.data;
}

export async function updateEvent(
  id: string,
  body: Partial<EventFormValues>
): Promise<EventItem> {
  const res = await apiClient.put<ApiResponse<EventItem>>(`/events/${id}`, body);
  if (!res.data) throw new Error("Empty response when updating event");
  return res.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}
