import type {
  TimelineDateGroup,
  TimelineEntry,
  TimelineEventEntry,
  TimelineFilterType,
  TimelineMonthGroup,
  TimelineNoteEntry,
  TimelineTimeHorizon,
  TimelineYearGroup,
} from "@/types/timeline.types";
import type { CalendarWorkspace, EventItem, NoteItem } from "@/types";
import type { LocalCalendar, LocalEvent, LocalNote } from "@/db";
import { MONTH_NAMES, dateKey } from "./calendar";

/**
 * Strips HTML tags and extracts plain text for safe, compact previews.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function toCalendarWorkspace(local: LocalCalendar): CalendarWorkspace {
  return {
    id: local.id,
    name: local.name,
    emoji: local.emoji,
    color: local.color,
    description: local.description,
    isDefault: local.isDefault,
    isVisible: local.isVisible,
    isArchived: local.isArchived,
    createdAt: local.createdAt,
    updatedAt: local.localUpdatedAt,
  };
}

export function toEventItem(
  local: LocalEvent & { occurrenceStartAt?: string; occurrenceEndAt?: string }
): EventItem {
  return {
    id: local.id,
    calendarId: local.calendarId,
    title: local.title,
    description: local.description,
    emoji: local.emoji,
    highlightColor: local.highlightColor,
    highlightStyle: local.highlightStyle as any,
    startAt: local.occurrenceStartAt || local.startAt,
    endAt: local.occurrenceEndAt || local.endAt,
    isAllDay: local.isAllDay,
    location: local.location,
    priority: local.priority as any,
    recurrenceRule: local.recurrenceRule,
    recurrenceEnd: local.recurrenceEnd,
    createdAt: local.createdAt,
    updatedAt: local.localUpdatedAt,
  };
}

export function toNoteItem(local: LocalNote): NoteItem {
  return {
    id: local.id,
    calendarId: local.calendarId,
    title: local.title,
    content: local.content,
    date: local.date,
    createdAt: local.createdAt,
    updatedAt: local.localUpdatedAt,
  };
}

interface GroupingOptions {
  events: (LocalEvent & {
    occurrenceStartAt: string;
    occurrenceEndAt: string;
    isOccurrence: boolean;
  })[];
  notes: LocalNote[];
  calendars: LocalCalendar[];
  typeFilter: TimelineFilterType;
  timeHorizon: TimelineTimeHorizon;
  customStartDate?: string;
  customEndDate?: string;
}

/**
 * Builds chronological Year -> Month -> Date -> Entries groups
 */
export function buildTimelineGroups(options: GroupingOptions): TimelineYearGroup[] {
  const {
    events,
    notes,
    calendars,
    typeFilter,
    timeHorizon,
    customStartDate,
    customEndDate,
  } = options;

  const calendarMap = new Map<string, CalendarWorkspace>();
  for (const c of calendars) {
    calendarMap.set(c.id, toCalendarWorkspace(c));
  }

  const now = new Date();
  const todayKey = dateKey(now);

  // Map to hold entries by dateKey (YYYY-MM-DD)
  const dateMap = new Map<string, { date: Date; entries: TimelineEntry[] }>();

  function getOrCreateDateBucket(key: string, date: Date) {
    let bucket = dateMap.get(key);
    if (!bucket) {
      bucket = { date, entries: [] };
      dateMap.set(key, bucket);
    }
    return bucket;
  }

  // 1. Process Events
  if (typeFilter === "all" || typeFilter === "events") {
    for (const evt of events) {
      const k = evt.occurrenceStartAt.split("T")[0];

      // Time horizon filtering
      if (timeHorizon === "past" && k >= todayKey) continue;
      if (timeHorizon === "today" && k !== todayKey) continue;
      if (timeHorizon === "upcoming" && k <= todayKey) continue;

      // Custom date filtering
      if (customStartDate && k < customStartDate.split("T")[0]) continue;
      if (customEndDate && k > customEndDate.split("T")[0]) continue;

      const rawEvent = toEventItem(evt);
      const entry: TimelineEventEntry = {
        type: "event",
        id: evt.isOccurrence ? `${evt.id}_${k}` : evt.id,
        baseEventId: evt.id,
        calendarId: evt.calendarId,
        title: evt.title,
        description: evt.description,
        emoji: evt.emoji,
        highlightColor: evt.highlightColor,
        highlightStyle: evt.highlightStyle,
        startAt: evt.occurrenceStartAt,
        endAt: evt.occurrenceEndAt,
        isAllDay: evt.isAllDay,
        location: evt.location,
        priority: evt.priority,
        recurrenceRule: evt.recurrenceRule,
        recurrenceEnd: evt.recurrenceEnd,
        isOccurrence: evt.isOccurrence,
        calendar: calendarMap.get(evt.calendarId),
        rawEvent,
      };

      // Construct representative Date for this calendar day at noon to avoid timezone border issues
      const [y, m, d] = k.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);

      const bucket = getOrCreateDateBucket(k, dateObj);
      bucket.entries.push(entry);
    }
  }

  // 2. Process Notes
  if (typeFilter === "all" || typeFilter === "notes") {
    for (const n of notes) {
      const k = n.date.split("T")[0];

      // Time horizon filtering
      if (timeHorizon === "past" && k >= todayKey) continue;
      if (timeHorizon === "today" && k !== todayKey) continue;
      if (timeHorizon === "upcoming" && k <= todayKey) continue;

      // Custom date filtering
      if (customStartDate && k < customStartDate.split("T")[0]) continue;
      if (customEndDate && k > customEndDate.split("T")[0]) continue;

      const rawNote = toNoteItem(n);
      const entry: TimelineNoteEntry = {
        type: "note",
        id: n.id,
        calendarId: n.calendarId,
        title: n.title,
        content: n.content,
        plainTextPreview: stripHtmlToText(n.content).slice(0, 160),
        date: n.date,
        updatedAt: n.localUpdatedAt,
        calendar: n.calendarId ? calendarMap.get(n.calendarId) : undefined,
        rawNote,
      };

      const [y, m, d] = k.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);

      const bucket = getOrCreateDateBucket(k, dateObj);
      bucket.entries.push(entry);
    }
  }

  // 3. Sort entries within each date:
  //    - All-day events first (alphabetical)
  //    - Timed events by startAt ascending
  //    - Notes following events (by title / creation)
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateGroups: TimelineDateGroup[] = [];

  const sortedDateKeys = Array.from(dateMap.keys()).sort();

  for (const k of sortedDateKeys) {
    const bucket = dateMap.get(k)!;

    bucket.entries.sort((a, b) => {
      // If one is all-day event and one isn't
      if (a.type === "event" && b.type === "event") {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        if (a.isAllDay && b.isAllDay) return a.title.localeCompare(b.title);
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      }
      if (a.type === "event" && b.type === "note") {
        return -1; // Events appear before notes on the same date
      }
      if (a.type === "note" && b.type === "event") {
        return 1;
      }
      // Both notes
      return (a.title || "").localeCompare(b.title || "");
    });

    const d = bucket.date;
    const isToday = k === todayKey;
    const isPast = k < todayKey;
    const isFuture = k > todayKey;

    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);

    dateGroups.push({
      dateKey: k,
      date: d,
      dayOfMonth: d.getDate(),
      dayName: dayNames[d.getDay()],
      monthName: MONTH_NAMES[d.getMonth()],
      year: d.getFullYear(),
      formattedDate,
      isToday,
      isPast,
      isFuture,
      entries: bucket.entries,
    });
  }

  // 4. Group DateGroups into Months and Years
  const yearMap = new Map<number, Map<number, TimelineDateGroup[]>>();

  for (const dg of dateGroups) {
    let months = yearMap.get(dg.year);
    if (!months) {
      months = new Map<number, TimelineDateGroup[]>();
      yearMap.set(dg.year, months);
    }
    const monthIndex = dg.date.getMonth();
    let monthDates = months.get(monthIndex);
    if (!monthDates) {
      monthDates = [];
      months.set(monthIndex, monthDates);
    }
    monthDates.push(dg);
  }

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
  const yearGroups: TimelineYearGroup[] = [];

  for (const y of sortedYears) {
    const months = yearMap.get(y)!;
    const sortedMonths = Array.from(months.keys()).sort((a, b) => a - b);
    const monthGroups: TimelineMonthGroup[] = [];
    let yearTotal = 0;

    for (const m of sortedMonths) {
      const dates = months.get(m)!;
      const monthTotal = dates.reduce((sum, d) => sum + d.entries.length, 0);
      yearTotal += monthTotal;

      monthGroups.push({
        month: m,
        year: y,
        monthName: MONTH_NAMES[m],
        dateGroups: dates,
        totalEntries: monthTotal,
      });
    }

    yearGroups.push({
      year: y,
      monthGroups,
      totalEntries: yearTotal,
    });
  }

  return yearGroups;
}
