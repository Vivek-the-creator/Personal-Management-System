import type { CalendarWorkspace, EventItem, FestivalRecord, NoteItem } from "@/types";

export type SearchCategory = "all" | "events" | "notes" | "calendars" | "festivals";
export type SearchTimeHorizon = "all" | "past" | "today" | "upcoming";

export interface SearchEventResult {
  category: "event";
  id: string;
  title: string;
  description?: string;
  location?: string;
  emoji?: string;
  highlightColor: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  calendarId: string;
  calendarName?: string;
  calendarColor?: string;
  calendarEmoji?: string;
  score: number;
  rawEvent: EventItem;
}

export interface SearchNoteResult {
  category: "note";
  id: string;
  title?: string;
  plainTextContent: string;
  snippet: string;
  date: string;
  updatedAt: string;
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
  calendarEmoji?: string;
  score: number;
  rawNote: NoteItem;
}

export interface SearchCalendarResult {
  category: "calendar";
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  isArchived: boolean;
  itemCount: number;
  score: number;
  rawCalendar: CalendarWorkspace;
}

export interface SearchFestivalResult {
  category: "festival";
  id: string;
  name: string;
  localizedName?: string;
  description: string;
  emoji: string;
  date: string;
  festivalCategory: FestivalRecord["category"];
  score: number;
  rawFestival: FestivalRecord;
}

export type AnySearchResult =
  | SearchEventResult
  | SearchNoteResult
  | SearchCalendarResult
  | SearchFestivalResult;

export interface SearchResultsGrouped {
  events: SearchEventResult[];
  notes: SearchNoteResult[];
  calendars: SearchCalendarResult[];
  festivals: SearchFestivalResult[];
  totalEvents: number;
  totalNotes: number;
  totalCalendars: number;
  totalFestivals: number;
  totalCount: number;
  hasMoreEvents: boolean;
  hasMoreNotes: boolean;
}

export interface SearchSuggestions {
  recentNotes: SearchNoteResult[];
  upcomingEvents: SearchEventResult[];
}

export interface SearchFilters {
  query: string;
  category: SearchCategory;
  timeHorizon: SearchTimeHorizon;
  calendarId: string | null;
  customStartDate?: string;
  customEndDate?: string;
  limit?: number;
}
