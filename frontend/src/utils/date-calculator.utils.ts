import type { LocalCalendar, LocalEvent } from "@/db";
import type {
  CountdownItem,
  CountdownStatus,
  DateCalculationResult,
  DateDifferenceResult,
  DateOperation,
  DurationUnit,
} from "@/types/tools.types";
import { addDays, dateKey, daysInMonth, formatDateLabel } from "@/utils/calendar";
import { expandEventOccurrences } from "@/utils/recurrence.utils";

const MS_PER_DAY = 86_400_000;

/**
 * Parse a YYYY-MM-DD string or Date into a local-midnight Date.
 * Throws an Error if the date is invalid or overflows calendar bounds (e.g. Feb 30).
 */
export function parseLocalDateInput(input: string | Date): Date {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error("Invalid date provided.");
    }
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }

  const trimmed = input.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    throw new Error("Please enter a valid date in YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  if (month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`Invalid calendar date: ${trimmed}`);
  }

  return new Date(year, month, day);
}

/**
 * DST-safe integer day difference between two local calendar dates.
 * Uses UTC midnight of each date's local Y/M/D components so 23h/25h DST days
 * never cause off-by-one rounding errors.
 */
export function calendarDaysBetween(start: Date, end: Date): number {
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((utcEnd - utcStart) / MS_PER_DAY);
}

/**
 * Add or subtract a duration (days, weeks, months, years) from a starting date.
 *
 * Month-end & Leap-year Policy:
 * When adding/subtracting months or years, if the original day of month exceeds
 * the number of days in the target month (e.g. Jan 31 + 1 month, or Feb 29 + 1 year),
 * the day is clamped to the last valid day of the target month rather than overflowing.
 */
export function calculateDateOffset(
  startInput: string | Date,
  amount: number,
  unit: DurationUnit,
  operation: DateOperation
): DateCalculationResult {
  const originalDate = parseLocalDateInput(startInput);

  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    throw new Error("Duration must be a whole number.");
  }
  if (amount < 0) {
    throw new Error("Duration cannot be negative. Use Subtract instead.");
  }

  const sign = operation === "add" ? 1 : -1;
  const signedAmount = sign * amount;

  let calculatedDate: Date;
  let wasMonthEndClamped = false;

  if (unit === "days") {
    calculatedDate = addDays(originalDate, signedAmount);
  } else if (unit === "weeks") {
    calculatedDate = addDays(originalDate, signedAmount * 7);
  } else if (unit === "months") {
    const origYear = originalDate.getFullYear();
    const origMonth = originalDate.getMonth();
    const origDay = originalDate.getDate();

    const totalMonths = origYear * 12 + origMonth + signedAmount;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = ((totalMonths % 12) + 12) % 12;
    const maxDay = daysInMonth(targetYear, targetMonth);
    const targetDay = Math.min(origDay, maxDay);

    wasMonthEndClamped = targetDay < origDay;
    calculatedDate = new Date(targetYear, targetMonth, targetDay);
  } else {
    // years
    const targetYear = originalDate.getFullYear() + signedAmount;
    const targetMonth = originalDate.getMonth();
    const origDay = originalDate.getDate();
    const maxDay = daysInMonth(targetYear, targetMonth);
    const targetDay = Math.min(origDay, maxDay);

    wasMonthEndClamped = targetDay < origDay;
    calculatedDate = new Date(targetYear, targetMonth, targetDay);
  }

  const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    calculatedDate
  );

  const unitLabel = amount === 1 ? unit.slice(0, -1) : unit;
  const verb = operation === "add" ? "after" : "before";
  const clampNote = wasMonthEndClamped
    ? " (clamped to month end)"
    : "";

  const explanation =
    amount === 0
      ? `0 ${unit} from ${formatDateLabel(originalDate)} is the same date.`
      : `${amount} ${unitLabel} ${verb} ${formatDateLabel(originalDate)} is ${formatDateLabel(calculatedDate)}${clampNote}.`;

  return {
    originalDate,
    originalDateKey: dateKey(originalDate),
    calculatedDate,
    calculatedDateKey: dateKey(calculatedDate),
    dayOfWeek,
    operation,
    amount,
    unit,
    explanation,
    wasMonthEndClamped,
  };
}

/**
 * Calculate the difference between two calendar dates, returning:
 * - exclusiveDays (dateB - dateA; 0 if same day)
 * - inclusiveDays (exclusiveDays + 1; 1 if same day)
 * - weeks + remainingDays
 * - calendar years, months, days breakdown
 */
export function calculateDateDifference(
  dateAInput: string | Date,
  dateBInput: string | Date
): DateDifferenceResult {
  const dateA = parseLocalDateInput(dateAInput);
  const dateB = parseLocalDateInput(dateBInput);

  const isReversed = dateA.getTime() > dateB.getTime();
  const startDate = isReversed ? dateB : dateA;
  const endDate = isReversed ? dateA : dateB;

  const exclusiveDays = calendarDaysBetween(startDate, endDate);
  const inclusiveDays = exclusiveDays + 1;
  const weeks = Math.floor(exclusiveDays / 7);
  const remainingDays = exclusiveDays % 7;

  // Calendar years / months / days breakdown
  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    // Days in the month immediately preceding endDate's month
    const prevMonthYear =
      endDate.getMonth() === 0 ? endDate.getFullYear() - 1 : endDate.getFullYear();
    const prevMonthIndex = endDate.getMonth() === 0 ? 11 : endDate.getMonth() - 1;
    const prevMonthDays = daysInMonth(prevMonthYear, prevMonthIndex);
    days += prevMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  const explanation =
    exclusiveDays === 0
      ? "Both dates are the same day (0 days apart, 1 day inclusive)."
      : `${parts.join(", ")} between ${formatDateLabel(startDate)} and ${formatDateLabel(endDate)} (${exclusiveDays} exclusive, ${inclusiveDays} inclusive).`;

  return {
    startDate,
    endDate,
    startDateKey: dateKey(startDate),
    endDateKey: dateKey(endDate),
    isReversed,
    exclusiveDays,
    inclusiveDays,
    weeks,
    remainingDays,
    years,
    months,
    days,
    explanation,
  };
}

const BIRTHDAY_ANNIVERSARY_PATTERN = /\b(birthday|bday|anniversary|wedding|born)\b/i;
const BIRTHDAY_EMOJIS = new Set(["🎂", "🎉", "🥳", "💍", "💐", "🎁"]);

/**
 * Pure function to compute upcoming event countdowns from local events & calendars.
 * - Excludes deleted events and events from deleted/archived calendars.
 * - Excludes past events.
 * - Uses `expandEventOccurrences` for recurring events (e.g. yearly birthdays).
 */
export function buildUpcomingCountdowns(
  events: LocalEvent[],
  calendars: LocalCalendar[],
  referenceDate: Date = new Date(),
  limit = 25
): CountdownItem[] {
  const today = parseLocalDateInput(referenceDate);
  const windowEnd = new Date(
    today.getFullYear() + 2,
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  const calendarMap = new Map<string, LocalCalendar>();
  for (const cal of calendars) {
    if (!cal.deletedAt && !cal.isArchived) {
      calendarMap.set(cal.id, cal);
    }
  }

  const items: CountdownItem[] = [];

  for (const evt of events) {
    if (evt.deletedAt) continue;
    const cal = calendarMap.get(evt.calendarId);
    if (!cal) continue;

    const rule = evt.recurrenceRule?.toLowerCase();
    const isRecurring = Boolean(rule && rule !== "none");

    let targetDate: Date | null = null;

    if (!isRecurring) {
      const start = new Date(evt.startAt);
      const localStart = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      if (calendarDaysBetween(today, localStart) >= 0) {
        targetDate = localStart;
      }
    } else {
      const occurrences = expandEventOccurrences(evt, today, windowEnd);
      for (const occ of occurrences) {
        const occStart = new Date(occ.startAt);
        const localOcc = new Date(
          occStart.getFullYear(),
          occStart.getMonth(),
          occStart.getDate()
        );
        if (calendarDaysBetween(today, localOcc) >= 0) {
          targetDate = localOcc;
          break;
        }
      }
    }

    if (!targetDate) continue;

    const daysRemaining = calendarDaysBetween(today, targetDate);
    if (daysRemaining < 0) continue;

    const status: CountdownStatus =
      daysRemaining === 0
        ? "today"
        : daysRemaining === 1
          ? "tomorrow"
          : "upcoming";

    const isBirthdayOrAnniversary =
      BIRTHDAY_ANNIVERSARY_PATTERN.test(evt.title) ||
      (evt.emoji ? BIRTHDAY_EMOJIS.has(evt.emoji) : false) ||
      rule === "yearly";

    items.push({
      id: `${evt.id}-${dateKey(targetDate)}`,
      eventId: evt.id,
      title: evt.title,
      emoji: evt.emoji || "📅",
      targetDate,
      targetDateKey: dateKey(targetDate),
      daysRemaining,
      status,
      calendarId: cal.id,
      calendarName: cal.name,
      calendarColor: cal.color,
      calendarEmoji: cal.emoji,
      isRecurring,
      isBirthdayOrAnniversary,
    });
  }

  items.sort((a, b) => {
    if (a.daysRemaining !== b.daysRemaining) {
      return a.daysRemaining - b.daysRemaining;
    }
    return a.title.localeCompare(b.title);
  });

  return items.slice(0, limit);
}
