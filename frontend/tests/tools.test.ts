import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildUpcomingCountdowns,
  calculateDateDifference,
  calculateDateOffset,
  calendarDaysBetween,
  parseLocalDateInput,
} from "../src/utils/date-calculator.utils";
import type { LocalCalendar, LocalEvent } from "../src/db";

function makeCalendar(overrides: Partial<LocalCalendar> = {}): LocalCalendar {
  return {
    id: "cal-1",
    userId: "user-1",
    name: "Personal",
    emoji: "🏠",
    color: "#7C3AED",
    isDefault: true,
    isVisible: true,
    isArchived: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    localUpdatedAt: "2025-01-01T00:00:00.000Z",
    serverUpdatedAt: null,
    syncStatus: "synced",
    deletedAt: null,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "evt-1",
    userId: "user-1",
    calendarId: "cal-1",
    title: "Test Event",
    highlightColor: "#7C3AED",
    highlightStyle: "background",
    startAt: "2026-12-01T09:00:00.000Z",
    endAt: "2026-12-01T10:00:00.000Z",
    isAllDay: false,
    priority: "normal",
    createdAt: "2026-01-01T00:00:00.000Z",
    localUpdatedAt: "2026-01-01T00:00:00.000Z",
    serverUpdatedAt: null,
    syncStatus: "synced",
    deletedAt: null,
    ...overrides,
  };
}

describe("PHASE 11: Date Calculator & Boundary Arithmetic", () => {
  it("adds days, weeks, months, and years accurately", () => {
    const addDaysRes = calculateDateOffset("2026-11-25", 20, "days", "add");
    assert.equal(addDaysRes.calculatedDateKey, "2026-12-15");

    const addWeeksRes = calculateDateOffset("2026-11-25", 3, "weeks", "add");
    assert.equal(addWeeksRes.calculatedDateKey, "2026-12-16");

    const addMonthsRes = calculateDateOffset("2026-11-25", 2, "months", "add");
    assert.equal(addMonthsRes.calculatedDateKey, "2027-01-25");

    const addYearsRes = calculateDateOffset("2026-11-25", 4, "years", "add");
    assert.equal(addYearsRes.calculatedDateKey, "2030-11-25");
  });

  it("subtracts days, weeks, months, and years accurately", () => {
    const subDaysRes = calculateDateOffset("2026-11-25", 45, "days", "subtract");
    assert.equal(subDaysRes.calculatedDateKey, "2026-10-11");

    const subWeeksRes = calculateDateOffset("2026-01-10", 2, "weeks", "subtract");
    assert.equal(subWeeksRes.calculatedDateKey, "2025-12-27");

    const subMonthsRes = calculateDateOffset("2026-02-15", 3, "months", "subtract");
    assert.equal(subMonthsRes.calculatedDateKey, "2025-11-15");

    const subYearsRes = calculateDateOffset("2026-11-25", 2, "years", "subtract");
    assert.equal(subYearsRes.calculatedDateKey, "2024-11-25");
  });

  it("applies month-end clamping policy for Jan 31 and 31-day months", () => {
    // Non-leap year: Jan 31 + 1 month -> Feb 28
    const nonLeap = calculateDateOffset("2026-01-31", 1, "months", "add");
    assert.equal(nonLeap.calculatedDateKey, "2026-02-28");
    assert.equal(nonLeap.wasMonthEndClamped, true);

    // Leap year: Jan 31 + 1 month -> Feb 29
    const leap = calculateDateOffset("2024-01-31", 1, "months", "add");
    assert.equal(leap.calculatedDateKey, "2024-02-29");
    assert.equal(leap.wasMonthEndClamped, true);

    // Mar 31 - 1 month -> Feb 28
    const subToFeb = calculateDateOffset("2026-03-31", 1, "months", "subtract");
    assert.equal(subToFeb.calculatedDateKey, "2026-02-28");
    assert.equal(subToFeb.wasMonthEndClamped, true);

    // May 31 + 1 month -> Jun 30
    const mayToJun = calculateDateOffset("2026-05-31", 1, "months", "add");
    assert.equal(mayToJun.calculatedDateKey, "2026-06-30");
    assert.equal(mayToJun.wasMonthEndClamped, true);
  });

  it("handles leap-year Feb 29 year additions and subtractions", () => {
    const plusOneYear = calculateDateOffset("2024-02-29", 1, "years", "add");
    assert.equal(plusOneYear.calculatedDateKey, "2025-02-28");
    assert.equal(plusOneYear.wasMonthEndClamped, true);

    const plusFourYears = calculateDateOffset("2024-02-29", 4, "years", "add");
    assert.equal(plusFourYears.calculatedDateKey, "2028-02-29");
    assert.equal(plusFourYears.wasMonthEndClamped, false);
  });

  it("validates zero, negative, non-integer, and invalid date inputs", () => {
    const zeroDays = calculateDateOffset("2026-11-25", 0, "days", "add");
    assert.equal(zeroDays.calculatedDateKey, "2026-11-25");

    assert.throws(() => calculateDateOffset("2026-11-25", -5, "days", "add"));
    assert.throws(() => calculateDateOffset("2026-11-25", 1.5, "days", "add"));
    assert.throws(() => parseLocalDateInput("2026-02-30"));
    assert.throws(() => parseLocalDateInput("not-a-date"));
  });

  it("calculates inclusive vs exclusive date differences across month and year boundaries", () => {
    const sameDay = calculateDateDifference("2026-11-25", "2026-11-25");
    assert.equal(sameDay.exclusiveDays, 0);
    assert.equal(sameDay.inclusiveDays, 1);

    const crossYear = calculateDateDifference("2025-12-20", "2026-01-10");
    assert.equal(crossYear.exclusiveDays, 21);
    assert.equal(crossYear.inclusiveDays, 22);
    assert.equal(crossYear.weeks, 3);
    assert.equal(crossYear.remainingDays, 0);
    assert.equal(crossYear.years, 0);
    assert.equal(crossYear.months, 0);
    assert.equal(crossYear.days, 21);

    // Full multi-year span including 2024 leap day
    const multiYear = calculateDateDifference("2024-01-01", "2026-03-05");
    assert.equal(multiYear.years, 2);
    assert.equal(multiYear.months, 2);
    assert.equal(multiYear.days, 4);
    assert.equal(multiYear.exclusiveDays, 794);
    assert.equal(multiYear.inclusiveDays, 795);

    // Reversed order still computes positive span and flags isReversed
    const reversed = calculateDateDifference("2026-03-05", "2024-01-01");
    assert.equal(reversed.isReversed, true);
    assert.equal(reversed.exclusiveDays, 794);
  });

  it("computes DST-safe calendar days without timezone shift", () => {
    // Across US/EU DST spring-forward month (March)
    const days = calendarDaysBetween(
      parseLocalDateInput("2026-03-01"),
      parseLocalDateInput("2026-04-01")
    );
    assert.equal(days, 31);
  });
});

describe("PHASE 11: Event Countdowns & Calendar Navigation", () => {
  it("computes today, tomorrow, and upcoming states and excludes past events", () => {
    const refDate = new Date(2026, 10, 25, 10, 0, 0); // 2026-11-25
    const cal = makeCalendar();

    const events: LocalEvent[] = [
      makeEvent({
        id: "past",
        title: "Past Meeting",
        startAt: new Date(2026, 10, 24, 9, 0).toISOString(),
        endAt: new Date(2026, 10, 24, 10, 0).toISOString(),
      }),
      makeEvent({
        id: "today",
        title: "Today Standup",
        startAt: new Date(2026, 10, 25, 14, 0).toISOString(),
        endAt: new Date(2026, 10, 25, 15, 0).toISOString(),
      }),
      makeEvent({
        id: "tomorrow",
        title: "Tomorrow Demo",
        startAt: new Date(2026, 10, 26, 11, 0).toISOString(),
        endAt: new Date(2026, 10, 26, 12, 0).toISOString(),
      }),
      makeEvent({
        id: "future",
        title: "Trip",
        startAt: new Date(2026, 11, 5, 8, 0).toISOString(),
        endAt: new Date(2026, 11, 5, 9, 0).toISOString(),
      }),
    ];

    const countdowns = buildUpcomingCountdowns(events, [cal], refDate);
    assert.equal(countdowns.length, 3);
    assert.equal(countdowns.some((c) => c.eventId === "past"), false);

    assert.equal(countdowns[0].eventId, "today");
    assert.equal(countdowns[0].status, "today");
    assert.equal(countdowns[0].daysRemaining, 0);

    assert.equal(countdowns[1].eventId, "tomorrow");
    assert.equal(countdowns[1].status, "tomorrow");
    assert.equal(countdowns[1].daysRemaining, 1);

    assert.equal(countdowns[2].eventId, "future");
    assert.equal(countdowns[2].status, "upcoming");
    assert.equal(countdowns[2].daysRemaining, 10);
  });

  it("calculates next occurrence for recurring yearly birthdays and excludes archived/deleted", () => {
    const refDate = new Date(2026, 10, 25, 10, 0, 0); // 2026-11-25
    const activeCal = makeCalendar({ id: "cal-active" });
    const archivedCal = makeCalendar({ id: "cal-archived", isArchived: true });

    const events: LocalEvent[] = [
      makeEvent({
        id: "bday-1",
        calendarId: "cal-active",
        title: "Mom's Birthday",
        emoji: "🎂",
        recurrenceRule: "yearly",
        // Original start date was in 2020 on Dec 10 — next occurrence from 2026-11-25 is 2026-12-10 (15 days)
        startAt: new Date(2020, 11, 10, 9, 0).toISOString(),
        endAt: new Date(2020, 11, 10, 10, 0).toISOString(),
      }),
      makeEvent({
        id: "archived-evt",
        calendarId: "cal-archived",
        title: "Archived Event",
        startAt: new Date(2026, 11, 1, 9, 0).toISOString(),
        endAt: new Date(2026, 11, 1, 10, 0).toISOString(),
      }),
    ];

    const countdowns = buildUpcomingCountdowns(
      events,
      [activeCal, archivedCal],
      refDate
    );
    assert.equal(countdowns.length, 1);
    assert.equal(countdowns[0].eventId, "bday-1");
    assert.equal(countdowns[0].targetDateKey, "2026-12-10");
    assert.equal(countdowns[0].daysRemaining, 15);
    assert.equal(countdowns[0].isRecurring, true);
    assert.equal(countdowns[0].isBirthdayOrAnniversary, true);
  });
});
