import type { LocalEvent } from "@/db";

export interface EventOccurrence {
  startAt: string;
  endAt: string;
  isOccurrence: boolean;
}

/**
 * Normalizes a date to YYYY-MM-DD in local time
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Efficiently expands recurring events into occurrences within a specified query window [rangeStart, rangeEnd].
 * Does NOT mutate or duplicate events in database.
 * Supports: "daily", "weekly", "monthly", "yearly".
 * Preserves duration and time-of-day.
 * Safely bounds iterations so infinite loops are impossible.
 */
export function expandEventOccurrences(
  event: LocalEvent,
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const eventStart = new Date(event.startAt);
  const eventEnd = new Date(event.endAt);
  const durationMs = Math.max(0, eventEnd.getTime() - eventStart.getTime());

  const rule = event.recurrenceRule?.toLowerCase();

  // If not recurring or invalid rule, return single occurrence if it intersects window
  if (!rule || rule === "none") {
    if (eventEnd >= rangeStart && eventStart <= rangeEnd) {
      return [{ startAt: event.startAt, endAt: event.endAt, isOccurrence: false }];
    }
    return [];
  }

  // Recurrence end boundary (if defined)
  const maxEnd = event.recurrenceEnd ? new Date(event.recurrenceEnd) : null;
  const effectiveWindowEnd = maxEnd && maxEnd < rangeEnd ? maxEnd : rangeEnd;

  // If the event starts after the window end, or maxEnd is before window start, no occurrences
  if (eventStart > effectiveWindowEnd || (maxEnd && maxEnd < rangeStart)) {
    return [];
  }

  const occurrences: EventOccurrence[] = [];
  const MAX_OCCURRENCES = 750; // Safety safeguard per event per query window

  switch (rule) {
    case "daily": {
      // Find start cursor
      let cursor = new Date(eventStart);
      if (cursor < rangeStart) {
        const diffMs = rangeStart.getTime() - cursor.getTime();
        const daysToSkip = Math.floor(diffMs / 86400000);
        if (daysToSkip > 0) {
          cursor.setDate(cursor.getDate() + daysToSkip);
        }
      }

      while (cursor <= effectiveWindowEnd && occurrences.length < MAX_OCCURRENCES) {
        const occStart = new Date(cursor);
        const occEnd = new Date(occStart.getTime() + durationMs);

        if (occEnd >= rangeStart && occStart <= effectiveWindowEnd) {
          occurrences.push({
            startAt: occStart.toISOString(),
            endAt: occEnd.toISOString(),
            isOccurrence: occStart.getTime() !== eventStart.getTime(),
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      break;
    }

    case "weekly": {
      let cursor = new Date(eventStart);
      if (cursor < rangeStart) {
        const diffMs = rangeStart.getTime() - cursor.getTime();
        const weeksToSkip = Math.floor(diffMs / (86400000 * 7));
        if (weeksToSkip > 0) {
          cursor.setDate(cursor.getDate() + weeksToSkip * 7);
        }
      }

      while (cursor <= effectiveWindowEnd && occurrences.length < MAX_OCCURRENCES) {
        const occStart = new Date(cursor);
        const occEnd = new Date(occStart.getTime() + durationMs);

        if (occEnd >= rangeStart && occStart <= effectiveWindowEnd) {
          occurrences.push({
            startAt: occStart.toISOString(),
            endAt: occEnd.toISOString(),
            isOccurrence: occStart.getTime() !== eventStart.getTime(),
          });
        }
        cursor.setDate(cursor.getDate() + 7);
      }
      break;
    }

    case "monthly": {
      const origDay = eventStart.getDate();
      const origHours = eventStart.getHours();
      const origMinutes = eventStart.getMinutes();
      const origSeconds = eventStart.getSeconds();
      const origMs = eventStart.getMilliseconds();

      let year = eventStart.getFullYear();
      let month = eventStart.getMonth();

      // Fast-forward year/month if rangeStart is far ahead
      if (rangeStart.getFullYear() > year) {
        year = rangeStart.getFullYear() - 1;
      }

      let safety = 0;
      while (safety++ < 1200 && occurrences.length < MAX_OCCURRENCES) {
        // Clamp day to valid days in that month (e.g. Feb 30 -> Feb 28/29)
        const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
        const targetDay = Math.min(origDay, daysInTargetMonth);

        const occStart = new Date(year, month, targetDay, origHours, origMinutes, origSeconds, origMs);
        const occEnd = new Date(occStart.getTime() + durationMs);

        if (occStart > effectiveWindowEnd) break;

        if (occStart >= eventStart && occEnd >= rangeStart && occStart <= effectiveWindowEnd) {
          occurrences.push({
            startAt: occStart.toISOString(),
            endAt: occEnd.toISOString(),
            isOccurrence: occStart.getTime() !== eventStart.getTime(),
          });
        }

        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }
      break;
    }

    case "yearly": {
      const origMonth = eventStart.getMonth();
      const origDay = eventStart.getDate();
      const origHours = eventStart.getHours();
      const origMinutes = eventStart.getMinutes();
      const origSeconds = eventStart.getSeconds();
      const origMs = eventStart.getMilliseconds();

      let year = eventStart.getFullYear();
      if (rangeStart.getFullYear() > year) {
        year = rangeStart.getFullYear();
      }

      let safety = 0;
      while (safety++ < 120 && occurrences.length < MAX_OCCURRENCES) {
        const daysInTargetMonth = new Date(year, origMonth + 1, 0).getDate();
        const targetDay = Math.min(origDay, daysInTargetMonth);

        const occStart = new Date(year, origMonth, targetDay, origHours, origMinutes, origSeconds, origMs);
        const occEnd = new Date(occStart.getTime() + durationMs);

        if (occStart > effectiveWindowEnd) break;

        if (occStart >= eventStart && occEnd >= rangeStart && occStart <= effectiveWindowEnd) {
          occurrences.push({
            startAt: occStart.toISOString(),
            endAt: occEnd.toISOString(),
            isOccurrence: occStart.getTime() !== eventStart.getTime(),
          });
        }

        year++;
      }
      break;
    }

    default: {
      // Fallback: single occurrence
      if (eventEnd >= rangeStart && eventStart <= rangeEnd) {
        occurrences.push({ startAt: event.startAt, endAt: event.endAt, isOccurrence: false });
      }
      break;
    }
  }

  return occurrences;
}
