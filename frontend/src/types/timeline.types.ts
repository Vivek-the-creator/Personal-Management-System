import type { EventItem, NoteItem, CalendarWorkspace } from "@/types";

export type TimelineFilterType = "all" | "events" | "notes";
export type TimelineTimeHorizon = "all" | "past" | "today" | "upcoming";

export interface TimelineEventEntry {
  type: "event";
  id: string; // original event id or `${id}_${occurrenceDate}`
  baseEventId: string;
  calendarId: string;
  title: string;
  description?: string;
  emoji?: string;
  highlightColor: string;
  highlightStyle: string;
  startAt: string; // ISO string for this occurrence
  endAt: string;   // ISO string for this occurrence
  isAllDay: boolean;
  location?: string;
  priority: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;
  isOccurrence: boolean;
  calendar?: CalendarWorkspace;
  rawEvent: EventItem;
}

export interface TimelineNoteEntry {
  type: "note";
  id: string;
  calendarId?: string;
  title?: string;
  content: string;
  plainTextPreview: string;
  date: string; // ISO date
  updatedAt: string;
  calendar?: CalendarWorkspace;
  rawNote: NoteItem;
}

export type TimelineEntry = TimelineEventEntry | TimelineNoteEntry;

export interface TimelineDateGroup {
  dateKey: string; // YYYY-MM-DD
  date: Date;
  dayOfMonth: number;
  dayName: string;
  monthName: string;
  year: number;
  formattedDate: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  entries: TimelineEntry[];
}

export interface TimelineMonthGroup {
  month: number; // 0-11
  year: number;
  monthName: string;
  dateGroups: TimelineDateGroup[];
  totalEntries: number;
}

export interface TimelineYearGroup {
  year: number;
  monthGroups: TimelineMonthGroup[];
  totalEntries: number;
}

export interface TimelineQueryFilters {
  calendarId?: string | null;
  typeFilter: TimelineFilterType;
  timeHorizon: TimelineTimeHorizon;
  customStartDate?: string;
  customEndDate?: string;
  startYear?: number;
  endYear?: number;
}
