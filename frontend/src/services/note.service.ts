import { apiClient } from "@/lib/api-client";
import type { ApiResponse, CreateNoteValues, NoteItem, UpdateNoteValues } from "@/types";

export interface GetNotesParams {
  calendarId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export async function getNotes(params: GetNotesParams = {}): Promise<NoteItem[]> {
  const queryParams = new URLSearchParams();
  if (params.calendarId) queryParams.append("calendarId", params.calendarId);
  if (params.date) queryParams.append("date", params.date);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const url = `/notes${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<ApiResponse<NoteItem[]>>(url);
  return res.data ?? [];
}

export async function createNote(body: CreateNoteValues): Promise<NoteItem> {
  const res = await apiClient.post<ApiResponse<NoteItem>>("/notes", body);
  if (!res.data) throw new Error("Empty response when creating note");
  return res.data;
}

export async function updateNote(
  id: string,
  body: UpdateNoteValues
): Promise<NoteItem> {
  const res = await apiClient.put<ApiResponse<NoteItem>>(`/notes/${id}`, body);
  if (!res.data) throw new Error("Empty response when updating note");
  return res.data;
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}
