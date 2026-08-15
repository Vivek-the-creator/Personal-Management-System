export type HighlightStyle =
  | "background"
  | "outline"
  | "top_accent"
  | "bottom_accent"
  | "left_accent"
  | "dot";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export type RecurrenceRule =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export interface EventItem {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  emoji?: string;
  highlightColor: string;
  highlightStyle: HighlightStyle;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  location?: string;
  priority: PriorityLevel;
  recurrenceRule?: RecurrenceRule | string;
  recurrenceEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFormValues {
  calendarId: string;
  title: string;
  description?: string;
  emoji?: string;
  highlightColor: string;
  highlightStyle: HighlightStyle;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  location?: string;
  priority: PriorityLevel;
  recurrenceRule: string;
  recurrenceEnd?: string;
}
