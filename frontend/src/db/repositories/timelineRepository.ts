import { db, type LocalCalendar, type LocalEvent, type LocalNote } from "@/db";
import { expandEventOccurrences } from "@/utils/recurrence.utils";

export interface TimelineDataResult {
  events: (LocalEvent & {
    occurrenceStartAt: string;
    occurrenceEndAt: string;
    isOccurrence: boolean;
  })[];
  notes: LocalNote[];
  calendars: LocalCalendar[];
}

export const timelineRepository = {
  /**
   * Fetches all non-deleted events (expanded with recurrences) and notes for a user,
   * respecting calendar filtering, archived calendar exclusions, and date ranges.
   */
  async getTimelineData(
    userId: string,
    options: {
      calendarId?: string | null;
      startDate?: string;
      endDate?: string;
      includeArchived?: boolean;
    } = {}
  ): Promise<TimelineDataResult> {
    const { calendarId, startDate, endDate, includeArchived = false } = options;

    // 1. Fetch calendars
    const allCalendars = await db.calendars.where("userId").equals(userId).toArray();
    const activeCalendars = allCalendars.filter((c) => {
      if (c.deletedAt) return false;
      if (!includeArchived && c.isArchived) return false;
      return true;
    });

    const activeCalendarMap = new Map(activeCalendars.map((c) => [c.id, c]));

    // 2. Determine target calendar ids
    let allowedCalendarIds: Set<string>;
    if (calendarId) {
      allowedCalendarIds = new Set([calendarId]);
    } else {
      allowedCalendarIds = new Set(activeCalendars.map((c) => c.id));
    }

    // 3. Date boundaries for queries
    const rangeStart = startDate ? new Date(startDate) : new Date(1970, 0, 1);
    const rangeEnd = endDate ? new Date(endDate) : new Date(2100, 11, 31, 23, 59, 59);

    // 4. Fetch non-deleted events
    const allEvents = await db.events.where("userId").equals(userId).toArray();
    const candidateEvents = allEvents.filter((e) => {
      if (e.deletedAt) return false;
      if (!allowedCalendarIds.has(e.calendarId)) return false;
      return true;
    });

    // Expand occurrences
    const expandedEvents: TimelineDataResult["events"] = [];
    for (const evt of candidateEvents) {
      const occurrences = expandEventOccurrences(evt, rangeStart, rangeEnd);
      for (const occ of occurrences) {
        expandedEvents.push({
          ...evt,
          occurrenceStartAt: occ.startAt,
          occurrenceEndAt: occ.endAt,
          isOccurrence: occ.isOccurrence,
        });
      }
    }

    // 5. Fetch non-deleted notes
    const allNotes = await db.notes.where("userId").equals(userId).toArray();
    const rangeStartDay = startDate ? startDate.split("T")[0] : "1970-01-01";
    const rangeEndDay = endDate ? endDate.split("T")[0] : "2100-12-31";

    const filteredNotes = allNotes.filter((n) => {
      if (n.deletedAt) return false;

      // Calendar filtering on notes
      if (calendarId) {
        if (n.calendarId !== calendarId) return false;
      } else {
        // If note is tied to a calendar that is archived, omit it
        if (n.calendarId && !activeCalendarMap.has(n.calendarId)) {
          return false;
        }
      }

      const noteDay = n.date.split("T")[0];
      if (noteDay < rangeStartDay || noteDay > rangeEndDay) return false;

      return true;
    });

    return {
      events: expandedEvents,
      notes: filteredNotes,
      calendars: activeCalendars,
    };
  },

  /**
   * Scans all events and notes for this user to discover all years that have data.
   * Useful for the year jumper and pagination bounds.
   */
  async getAvailableYearRange(
    userId: string,
    calendarId?: string | null
  ): Promise<{ minYear: number; maxYear: number; yearsWithData: number[] }> {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>([currentYear]);

    const allEvents = await db.events.where("userId").equals(userId).toArray();
    for (const e of allEvents) {
      if (e.deletedAt) continue;
      if (calendarId && e.calendarId !== calendarId) continue;
      const startYear = new Date(e.startAt).getFullYear();
      if (!isNaN(startYear)) yearsSet.add(startYear);
      if (e.recurrenceRule && e.recurrenceRule !== "none") {
        if (e.recurrenceEnd) {
          const endYear = new Date(e.recurrenceEnd).getFullYear();
          if (!isNaN(endYear)) yearsSet.add(endYear);
        } else {
          // recurring indefinitely, add currentYear + 2
          yearsSet.add(currentYear + 1);
          yearsSet.add(currentYear + 2);
        }
      }
    }

    const allNotes = await db.notes.where("userId").equals(userId).toArray();
    for (const n of allNotes) {
      if (n.deletedAt) continue;
      if (calendarId && n.calendarId !== calendarId) continue;
      const noteYear = new Date(n.date).getFullYear();
      if (!isNaN(noteYear)) yearsSet.add(noteYear);
    }

    const yearsWithData = Array.from(yearsSet).sort((a, b) => a - b);
    const minYear = yearsWithData.length > 0 ? yearsWithData[0] : currentYear;
    const maxYear = yearsWithData.length > 0 ? yearsWithData[yearsWithData.length - 1] : currentYear;

    return { minYear, maxYear, yearsWithData };
  },
};
