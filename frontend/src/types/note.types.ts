export interface NoteItem {
  id: string;
  calendarId?: string;
  title?: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteValues {
  calendarId?: string;
  title?: string;
  content: string;
  date: string;
}

export interface UpdateNoteValues {
  calendarId?: string;
  title?: string;
  content?: string;
  date?: string;
}
