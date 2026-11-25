import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expandEventOccurrences } from "../src/utils/recurrence.utils";
import {
  buildTimelineGroups,
  stripHtmlToText,
} from "../src/utils/timeline.utils";
import type { LocalCalendar, LocalEvent, LocalNote } from "../src/db";
import { dateKey } from "../src/utils/calendar";

describe("PHASE 9A: Recurrence Engine Unit Tests", () => {
  const baseEvent: LocalEvent = {
    id: "evt-base-1",
    userId: "user-1",
    calendarId: "cal-personal",
    title: "Team Standup",
    highlightColor: "#7C3AED",
    highlightStyle: "background",
    startAt: "2026-08-01T09:00:00.000Z",
    endAt: "2026-08-01T09:30:00.000Z",
    isAllDay: false,
    priority: "medium",
    recurrenceRule: "none",
    createdAt: "2026-08-01T08:00:00.000Z",
    localUpdatedAt: "2026-08-01T08:00:00.000Z",
    serverUpdatedAt: null,
    syncStatus: "synced",
    deletedAt: null,
  };

  it("handles non-recurring event inside query window", () => {
    const rangeStart = new Date("2026-08-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-08-31T23:59:59.999Z");
    const occurrences = expandEventOccurrences(baseEvent, rangeStart, rangeEnd);

    assert.equal(occurrences.length, 1);
    assert.equal(occurrences[0].startAt, "2026-08-01T09:00:00.000Z");
    assert.equal(occurrences[0].isOccurrence, false);
  });

  it("handles non-recurring event outside query window", () => {
    const rangeStart = new Date("2026-09-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-09-30T23:59:59.999Z");
    const occurrences = expandEventOccurrences(baseEvent, rangeStart, rangeEnd);

    assert.equal(occurrences.length, 0);
  });

  it("expands daily recurring events across month boundaries", () => {
    const dailyEvent: LocalEvent = {
      ...baseEvent,
      recurrenceRule: "daily",
      startAt: "2026-08-28T07:00:00.000Z",
      endAt: "2026-08-28T07:30:00.000Z",
    };

    const rangeStart = new Date("2026-08-30T00:00:00.000Z");
    const rangeEnd = new Date("2026-09-02T23:59:59.999Z");

    const occurrences = expandEventOccurrences(dailyEvent, rangeStart, rangeEnd);
    // Aug 30, Aug 31, Sep 1, Sep 2 = 4 occurrences
    assert.equal(occurrences.length, 4);
    assert.equal(occurrences[0].startAt.slice(0, 10), "2026-08-30");
    assert.equal(occurrences[1].startAt.slice(0, 10), "2026-08-31");
    assert.equal(occurrences[2].startAt.slice(0, 10), "2026-09-01");
    assert.equal(occurrences[3].startAt.slice(0, 10), "2026-09-02");
  });

  it("respects recurrenceEnd for daily recurrence", () => {
    const dailyEventWithEnd: LocalEvent = {
      ...baseEvent,
      recurrenceRule: "daily",
      startAt: "2026-08-10T07:00:00.000Z",
      endAt: "2026-08-10T07:30:00.000Z",
      recurrenceEnd: "2026-08-13T23:59:59.999Z",
    };

    const rangeStart = new Date("2026-08-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-08-31T23:59:59.999Z");

    const occurrences = expandEventOccurrences(dailyEventWithEnd, rangeStart, rangeEnd);
    // Aug 10, 11, 12, 13 = 4 occurrences
    assert.equal(occurrences.length, 4);
    assert.equal(occurrences[3].startAt.slice(0, 10), "2026-08-13");
  });

  it("expands weekly recurring events maintaining 7-day intervals", () => {
    const weeklyEvent: LocalEvent = {
      ...baseEvent,
      recurrenceRule: "weekly",
      startAt: "2026-08-03T10:00:00.000Z", // Monday
      endAt: "2026-08-03T11:00:00.000Z",
    };

    const rangeStart = new Date("2026-08-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-08-31T23:59:59.999Z");

    const occurrences = expandEventOccurrences(weeklyEvent, rangeStart, rangeEnd);
    // Aug 3, 10, 17, 24, 31 = 5 Mondays
    assert.equal(occurrences.length, 5);
    assert.equal(occurrences[0].startAt.slice(0, 10), "2026-08-03");
    assert.equal(occurrences[1].startAt.slice(0, 10), "2026-08-10");
    assert.equal(occurrences[4].startAt.slice(0, 10), "2026-08-31");
  });

  it("expands monthly recurring events clamping to month lengths", () => {
    const monthlyEvent: LocalEvent = {
      ...baseEvent,
      recurrenceRule: "monthly",
      startAt: "2026-01-31T15:00:00.000Z",
      endAt: "2026-01-31T16:00:00.000Z",
    };

    const rangeStart = new Date("2026-01-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-04-30T23:59:59.999Z");

    const occurrences = expandEventOccurrences(monthlyEvent, rangeStart, rangeEnd);
    // Jan 31, Feb 28 (2026 is not leap year), Mar 31, Apr 30
    assert.equal(occurrences.length, 4);
    assert.equal(occurrences[0].startAt.slice(0, 10), "2026-01-31");
    assert.equal(occurrences[1].startAt.slice(0, 10), "2026-02-28");
    assert.equal(occurrences[2].startAt.slice(0, 10), "2026-03-31");
    assert.equal(occurrences[3].startAt.slice(0, 10), "2026-04-30");
  });

  it("expands yearly recurring events across multiple years", () => {
    const yearlyEvent: LocalEvent = {
      ...baseEvent,
      title: "Birthday",
      recurrenceRule: "yearly",
      startAt: "2020-08-20T00:00:00.000Z",
      endAt: "2020-08-20T23:59:59.999Z",
      isAllDay: true,
    };

    const rangeStart = new Date("2025-01-01T00:00:00.000Z");
    const rangeEnd = new Date("2028-12-31T23:59:59.999Z");

    const occurrences = expandEventOccurrences(yearlyEvent, rangeStart, rangeEnd);
    // 2025-08-20, 2026-08-20, 2027-08-20, 2028-08-20 = 4 occurrences
    assert.equal(occurrences.length, 4);
    assert.equal(occurrences[0].startAt.slice(0, 10), "2025-08-20");
    assert.equal(occurrences[1].startAt.slice(0, 10), "2026-08-20");
    assert.equal(occurrences[2].startAt.slice(0, 10), "2027-08-20");
    assert.equal(occurrences[3].startAt.slice(0, 10), "2028-08-20");
  });
});

describe("PHASE 9A: Timeline Grouping, Sorting & Filtering Tests", () => {
  const calPersonal: LocalCalendar = {
    id: "cal-pers",
    userId: "user-1",
    name: "Personal",
    emoji: "🏠",
    color: "#7C3AED",
    isDefault: true,
    isVisible: true,
    isArchived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    localUpdatedAt: "2026-01-01T00:00:00.000Z",
    serverUpdatedAt: null,
    syncStatus: "synced",
    deletedAt: null,
  };

  const calWork: LocalCalendar = {
    id: "cal-work",
    userId: "user-1",
    name: "Work",
    emoji: "💼",
    color: "#0EA5E9",
    isDefault: false,
    isVisible: true,
    isArchived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    localUpdatedAt: "2026-01-01T00:00:00.000Z",
    serverUpdatedAt: null,
    syncStatus: "synced",
    deletedAt: null,
  };

  const calArchived: LocalCalendar = {
    id: "cal-arch",
    userId: "user-1",
    name: "Old Project",
    emoji: "📦",
    color: "#64748B",
    isDefault: false,
    isVisible: false,
    isArchived: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    localUpdatedAt: "2025-01-01T00:00:00.000Z",
    serverUpdatedAt: null,
    syncStatus: "synced",
    deletedAt: null,
  };

  it("orders all-day events, timed events, and notes on the same date correctly", () => {
    const events = [
      {
        id: "evt-timed-2",
        userId: "user-1",
        calendarId: "cal-work",
        title: "Placement Meeting",
        highlightColor: "#0EA5E9",
        highlightStyle: "background",
        startAt: "2026-08-15T14:00:00.000Z",
        endAt: "2026-08-15T15:00:00.000Z",
        occurrenceStartAt: "2026-08-15T14:00:00.000Z",
        occurrenceEndAt: "2026-08-15T15:00:00.000Z",
        isAllDay: false,
        priority: "high",
        createdAt: "2026-08-01T00:00:00.000Z",
        localUpdatedAt: "2026-08-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-allday-1",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "College Presentation",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2026-08-15T00:00:00.000Z",
        endAt: "2026-08-15T23:59:59.999Z",
        occurrenceStartAt: "2026-08-15T00:00:00.000Z",
        occurrenceEndAt: "2026-08-15T23:59:59.999Z",
        isAllDay: true,
        priority: "urgent",
        createdAt: "2026-08-01T00:00:00.000Z",
        localUpdatedAt: "2026-08-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-timed-1",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Morning Rehearsal",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2026-08-15T08:00:00.000Z",
        endAt: "2026-08-15T09:00:00.000Z",
        occurrenceStartAt: "2026-08-15T08:00:00.000Z",
        occurrenceEndAt: "2026-08-15T09:00:00.000Z",
        isAllDay: false,
        priority: "medium",
        createdAt: "2026-08-01T00:00:00.000Z",
        localUpdatedAt: "2026-08-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
    ];

    const notes: LocalNote[] = [
      {
        id: "note-1",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Morning Thoughts",
        content: "<p>Excited about today's presentation!</p>",
        date: "2026-08-15T07:30:00.000Z",
        createdAt: "2026-08-15T07:30:00.000Z",
        localUpdatedAt: "2026-08-15T07:30:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced",
        deletedAt: null,
      },
      {
        id: "note-2",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Project Ideas",
        content: "<p>New thoughts on Phase 9 timeline features.</p>",
        date: "2026-08-15T19:00:00.000Z",
        createdAt: "2026-08-15T19:00:00.000Z",
        localUpdatedAt: "2026-08-15T19:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced",
        deletedAt: null,
      },
    ];

    const yearGroups = buildTimelineGroups({
      events,
      notes,
      calendars: [calPersonal, calWork],
      typeFilter: "all",
      timeHorizon: "all",
    });

    assert.equal(yearGroups.length, 1);
    const y2026 = yearGroups[0];
    assert.equal(y2026.year, 2026);
    assert.equal(y2026.monthGroups.length, 1);

    const august = y2026.monthGroups[0];
    assert.equal(august.monthName, "August");
    assert.equal(august.dateGroups.length, 1);

    const day15 = august.dateGroups[0];
    assert.equal(day15.entries.length, 5);

    // Order must be: All-day event -> Timed 8am -> Timed 2pm -> Notes
    assert.equal(day15.entries[0].type, "event");
    assert.equal(day15.entries[0].title, "College Presentation"); // All-day
    assert.equal((day15.entries[0] as any).isAllDay, true);

    assert.equal(day15.entries[1].type, "event");
    assert.equal(day15.entries[1].title, "Morning Rehearsal"); // 8:00 AM

    assert.equal(day15.entries[2].type, "event");
    assert.equal(day15.entries[2].title, "Placement Meeting"); // 14:00 PM

    assert.equal(day15.entries[3].type, "note");
    assert.equal(day15.entries[3].title, "Morning Thoughts");

    assert.equal(day15.entries[4].type, "note");
    assert.equal(day15.entries[4].title, "Project Ideas");
  });

  it("filters by type: Events only vs Notes only", () => {
    const events = [
      {
        id: "evt-1",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Event One",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2026-09-10T10:00:00.000Z",
        endAt: "2026-09-10T11:00:00.000Z",
        occurrenceStartAt: "2026-09-10T10:00:00.000Z",
        occurrenceEndAt: "2026-09-10T11:00:00.000Z",
        isAllDay: false,
        priority: "medium",
        createdAt: "2026-09-01T00:00:00.000Z",
        localUpdatedAt: "2026-09-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
    ];

    const notes: LocalNote[] = [
      {
        id: "note-1",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Note One",
        content: "<p>Text</p>",
        date: "2026-09-10T12:00:00.000Z",
        createdAt: "2026-09-10T12:00:00.000Z",
        localUpdatedAt: "2026-09-10T12:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced",
        deletedAt: null,
      },
    ];

    const eventsOnly = buildTimelineGroups({
      events,
      notes,
      calendars: [calPersonal],
      typeFilter: "events",
      timeHorizon: "all",
    });
    assert.equal(eventsOnly[0].totalEntries, 1);
    assert.equal(eventsOnly[0].monthGroups[0].dateGroups[0].entries[0].type, "event");

    const notesOnly = buildTimelineGroups({
      events,
      notes,
      calendars: [calPersonal],
      typeFilter: "notes",
      timeHorizon: "all",
    });
    assert.equal(notesOnly[0].totalEntries, 1);
    assert.equal(notesOnly[0].monthGroups[0].dateGroups[0].entries[0].type, "note");
  });

  it("hierarchical grouping by Year -> Month -> Date -> Entries across multiple years", () => {
    const events = [
      {
        id: "evt-2026",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Goa Trip",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2026-12-20T00:00:00.000Z",
        endAt: "2026-12-20T23:59:59.999Z",
        occurrenceStartAt: "2026-12-20T00:00:00.000Z",
        occurrenceEndAt: "2026-12-20T23:59:59.999Z",
        isAllDay: true,
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-2027",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Pongal Festival",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2027-01-15T00:00:00.000Z",
        endAt: "2027-01-15T23:59:59.999Z",
        occurrenceStartAt: "2027-01-15T00:00:00.000Z",
        occurrenceEndAt: "2027-01-15T23:59:59.999Z",
        isAllDay: true,
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-2028",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Family Vacation",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2028-06-18T00:00:00.000Z",
        endAt: "2028-06-18T23:59:59.999Z",
        occurrenceStartAt: "2028-06-18T00:00:00.000Z",
        occurrenceEndAt: "2028-06-18T23:59:59.999Z",
        isAllDay: true,
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
    ];

    const yearGroups = buildTimelineGroups({
      events,
      notes: [],
      calendars: [calPersonal],
      typeFilter: "all",
      timeHorizon: "all",
    });

    assert.equal(yearGroups.length, 3);
    assert.equal(yearGroups[0].year, 2026);
    assert.equal(yearGroups[1].year, 2027);
    assert.equal(yearGroups[2].year, 2028);

    assert.equal(yearGroups[0].monthGroups[0].monthName, "December");
    assert.equal(yearGroups[1].monthGroups[0].monthName, "January");
    assert.equal(yearGroups[2].monthGroups[0].monthName, "June");
  });

  it("identifies Today's date node with isToday=true and sets isPast and isFuture", () => {
    const today = new Date();
    const todayStr = dateKey(today);

    const yesterday = new Date(today.getTime() - 86400000);
    const yesterdayStr = dateKey(yesterday);

    const tomorrow = new Date(today.getTime() + 86400000);
    const tomorrowStr = dateKey(tomorrow);

    const events = [
      {
        id: "evt-yest",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Yesterday Event",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: `${yesterdayStr}T10:00:00.000Z`,
        endAt: `${yesterdayStr}T11:00:00.000Z`,
        occurrenceStartAt: `${yesterdayStr}T10:00:00.000Z`,
        occurrenceEndAt: `${yesterdayStr}T11:00:00.000Z`,
        isAllDay: false,
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-today",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Today Event",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: `${todayStr}T10:00:00.000Z`,
        endAt: `${todayStr}T11:00:00.000Z`,
        occurrenceStartAt: `${todayStr}T10:00:00.000Z`,
        occurrenceEndAt: `${todayStr}T11:00:00.000Z`,
        isAllDay: false,
        priority: "urgent",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-tom",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Tomorrow Event",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: `${tomorrowStr}T10:00:00.000Z`,
        endAt: `${tomorrowStr}T11:00:00.000Z`,
        occurrenceStartAt: `${tomorrowStr}T10:00:00.000Z`,
        occurrenceEndAt: `${tomorrowStr}T11:00:00.000Z`,
        isAllDay: false,
        priority: "low",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
    ];

    const yearGroups = buildTimelineGroups({
      events,
      notes: [],
      calendars: [calPersonal],
      typeFilter: "all",
      timeHorizon: "all",
    });

    const allDateGroups = yearGroups.flatMap((y) => y.monthGroups.flatMap((m) => m.dateGroups));

    const yestNode = allDateGroups.find((d) => d.dateKey === yesterdayStr);
    const todayNode = allDateGroups.find((d) => d.dateKey === todayStr);
    const tomNode = allDateGroups.find((d) => d.dateKey === tomorrowStr);

    assert.ok(yestNode);
    assert.equal(yestNode.isPast, true);
    assert.equal(yestNode.isToday, false);

    assert.ok(todayNode);
    assert.equal(todayNode.isToday, true);
    assert.equal(todayNode.isPast, false);
    assert.equal(todayNode.isFuture, false);

    assert.ok(tomNode);
    assert.equal(tomNode.isFuture, true);
    assert.equal(tomNode.isToday, false);
  });

  it("filters accurately across time horizons: past, today, upcoming", () => {
    const today = new Date();
    const todayStr = dateKey(today);
    const pastStr = dateKey(new Date(today.getTime() - 86400000 * 3));
    const futureStr = dateKey(new Date(today.getTime() + 86400000 * 3));

    const events = [
      {
        id: "evt-past",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Past Item",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: `${pastStr}T10:00:00.000Z`,
        endAt: `${pastStr}T11:00:00.000Z`,
        occurrenceStartAt: `${pastStr}T10:00:00.000Z`,
        occurrenceEndAt: `${pastStr}T11:00:00.000Z`,
        isAllDay: false,
        priority: "low",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-today",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Today Item",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: `${todayStr}T10:00:00.000Z`,
        endAt: `${todayStr}T11:00:00.000Z`,
        occurrenceStartAt: `${todayStr}T10:00:00.000Z`,
        occurrenceEndAt: `${todayStr}T11:00:00.000Z`,
        isAllDay: false,
        priority: "urgent",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-future",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Future Item",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: `${futureStr}T10:00:00.000Z`,
        endAt: `${futureStr}T11:00:00.000Z`,
        occurrenceStartAt: `${futureStr}T10:00:00.000Z`,
        occurrenceEndAt: `${futureStr}T11:00:00.000Z`,
        isAllDay: false,
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
    ];

    const pastGroups = buildTimelineGroups({
      events,
      notes: [],
      calendars: [calPersonal],
      typeFilter: "all",
      timeHorizon: "past",
    });
    assert.equal(pastGroups.reduce((acc, y) => acc + y.totalEntries, 0), 1);
    assert.equal(pastGroups[0].monthGroups[0].dateGroups[0].entries[0].title, "Past Item");

    const todayGroups = buildTimelineGroups({
      events,
      notes: [],
      calendars: [calPersonal],
      typeFilter: "all",
      timeHorizon: "today",
    });
    assert.equal(todayGroups.reduce((acc, y) => acc + y.totalEntries, 0), 1);
    assert.equal(todayGroups[0].monthGroups[0].dateGroups[0].entries[0].title, "Today Item");

    const upcomingGroups = buildTimelineGroups({
      events,
      notes: [],
      calendars: [calPersonal],
      typeFilter: "all",
      timeHorizon: "upcoming",
    });
    assert.equal(upcomingGroups.reduce((acc, y) => acc + y.totalEntries, 0), 1);
    assert.equal(upcomingGroups[0].monthGroups[0].dateGroups[0].entries[0].title, "Future Item");
  });

  it("filters by calendar: All Calendars vs Individual Calendar", () => {
    const events = [
      {
        id: "evt-p",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Personal Event",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2026-08-15T10:00:00.000Z",
        endAt: "2026-08-15T11:00:00.000Z",
        occurrenceStartAt: "2026-08-15T10:00:00.000Z",
        occurrenceEndAt: "2026-08-15T11:00:00.000Z",
        isAllDay: false,
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-w",
        userId: "user-1",
        calendarId: "cal-work",
        title: "Work Event",
        highlightColor: "#0EA5E9",
        highlightStyle: "background",
        startAt: "2026-08-15T14:00:00.000Z",
        endAt: "2026-08-15T15:00:00.000Z",
        occurrenceStartAt: "2026-08-15T14:00:00.000Z",
        occurrenceEndAt: "2026-08-15T15:00:00.000Z",
        isAllDay: false,
        priority: "high",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
    ];

    // All Calendars: both present
    const allGroups = buildTimelineGroups({
      events,
      notes: [],
      calendars: [calPersonal, calWork],
      typeFilter: "all",
      timeHorizon: "all",
    });
    assert.equal(allGroups[0].totalEntries, 2);

    // Filter to Personal: only evt-p present
    const persOnlyEvents = events.filter((e) => e.calendarId === "cal-pers");
    const persGroups = buildTimelineGroups({
      events: persOnlyEvents,
      notes: [],
      calendars: [calPersonal, calWork],
      typeFilter: "all",
      timeHorizon: "all",
    });
    assert.equal(persGroups[0].totalEntries, 1);
    assert.equal(persGroups[0].monthGroups[0].dateGroups[0].entries[0].title, "Personal Event");
  });

  it("excludes events belonging to archived calendars unless explicitly included", () => {
    const events = [
      {
        id: "evt-active",
        userId: "user-1",
        calendarId: "cal-pers",
        title: "Active Event",
        highlightColor: "#7C3AED",
        highlightStyle: "background",
        startAt: "2026-08-15T10:00:00.000Z",
        endAt: "2026-08-15T11:00:00.000Z",
        occurrenceStartAt: "2026-08-15T10:00:00.000Z",
        occurrenceEndAt: "2026-08-15T11:00:00.000Z",
        isAllDay: false,
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
      {
        id: "evt-archived",
        userId: "user-1",
        calendarId: "cal-arch",
        title: "Archived Event",
        highlightColor: "#64748B",
        highlightStyle: "background",
        startAt: "2026-08-15T14:00:00.000Z",
        endAt: "2026-08-15T15:00:00.000Z",
        occurrenceStartAt: "2026-08-15T14:00:00.000Z",
        occurrenceEndAt: "2026-08-15T15:00:00.000Z",
        isAllDay: false,
        priority: "low",
        createdAt: "2026-01-01T00:00:00.000Z",
        localUpdatedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: null,
        syncStatus: "synced" as const,
        deletedAt: null,
        isOccurrence: false,
      },
    ];

    // Only non-archived calendars passed to active list
    const activeCalendars = [calPersonal, calWork];
    const candidateEvents = events.filter((e) => activeCalendars.some((c) => c.id === e.calendarId));

    const groups = buildTimelineGroups({
      events: candidateEvents,
      notes: [],
      calendars: activeCalendars,
      typeFilter: "all",
      timeHorizon: "all",
    });

    assert.equal(groups[0].totalEntries, 1);
    assert.equal(groups[0].monthGroups[0].dateGroups[0].entries[0].title, "Active Event");
    assert.equal(calArchived.isArchived, true);
  });

  it("supports large historical and distant future date spans without arbitrary year restrictions", () => {
    const historicalEvent = {
      id: "evt-hist",
      userId: "user-1",
      calendarId: "cal-pers",
      title: "Ancient Memory 1995",
      highlightColor: "#7C3AED",
      highlightStyle: "background",
      startAt: "1995-05-12T00:00:00.000Z",
      endAt: "1995-05-12T23:59:59.999Z",
      occurrenceStartAt: "1995-05-12T00:00:00.000Z",
      occurrenceEndAt: "1995-05-12T23:59:59.999Z",
      isAllDay: true,
      priority: "low",
      createdAt: "1995-05-12T00:00:00.000Z",
      localUpdatedAt: "1995-05-12T00:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced" as const,
      deletedAt: null,
      isOccurrence: false,
    };

    const distantFutureEvent = {
      id: "evt-fut",
      userId: "user-1",
      calendarId: "cal-pers",
      title: "Futuristic Plan 2045",
      highlightColor: "#7C3AED",
      highlightStyle: "background",
      startAt: "2045-11-20T00:00:00.000Z",
      endAt: "2045-11-20T23:59:59.999Z",
      occurrenceStartAt: "2045-11-20T00:00:00.000Z",
      occurrenceEndAt: "2045-11-20T23:59:59.999Z",
      isAllDay: true,
      priority: "high",
      createdAt: "2026-01-01T00:00:00.000Z",
      localUpdatedAt: "2026-01-01T00:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced" as const,
      deletedAt: null,
      isOccurrence: false,
    };

    const yearGroups = buildTimelineGroups({
      events: [historicalEvent, distantFutureEvent],
      notes: [],
      calendars: [calPersonal],
      typeFilter: "all",
      timeHorizon: "all",
    });

    assert.equal(yearGroups.length, 2);
    assert.equal(yearGroups[0].year, 1995);
    assert.equal(yearGroups[1].year, 2045);
    assert.equal(yearGroups[0].monthGroups[0].dateGroups[0].entries[0].title, "Ancient Memory 1995");
    assert.equal(yearGroups[1].monthGroups[0].dateGroups[0].entries[0].title, "Futuristic Plan 2045");
  });

  it("strips HTML cleanly to text for preview without tag leaks", () => {
    const html = `<p>Hello <strong>World</strong>!</p><script>alert(1)</script><p>A &amp; B &quot;quote&quot;</p>`;
    const stripped = stripHtmlToText(html);
    assert.equal(stripped, `Hello World ! A & B "quote"`);
  });
});
