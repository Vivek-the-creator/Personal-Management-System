import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  executeSearchOnDataset,
  recentSearchHistory,
  type SearchDataset,
} from "../src/db/repositories/searchRepository";
import {
  extractSnippet,
  formatSearchDateLabel,
  highlightTokens,
  normalizeSearchText,
  tokenizeQuery,
} from "../src/utils/search.utils";
import type { LocalCalendar, LocalEvent, LocalNote } from "../src/db";
import { dateKey } from "../src/utils/calendar";

describe("PHASE 9B: Search Text Normalization & Safe Highlighting", () => {
  it("normalizes case, diacritics, and whitespace", () => {
    assert.equal(normalizeSearchText("  Café   Meeting! "), "cafe meeting!");
    assert.deepEqual(tokenizeQuery("  Goa   TRIP  goa "), ["goa", "trip"]);
  });

  it("highlights matching tokens safely without HTML injection and handles special regex characters", () => {
    const segments = highlightTokens("Review C++ (50%) <script>alert(1)</script>", "c++ 50%");
    const highlighted = segments.filter((s) => s.highlight).map((s) => s.text);
    assert.deepEqual(highlighted, ["C++", "50%"]);
    // Reconstructed text equals original string exactly
    assert.equal(
      segments.map((s) => s.text).join(""),
      "Review C++ (50%) <script>alert(1)</script>"
    );
  });

  it("extracts contextual snippet around matched keyword in long notes", () => {
    const longText =
      "A".repeat(80) + " Important architecture decision for Phase 9B " + "B".repeat(80);
    const snippet = extractSnippet(longText, ["architecture"], 80);
    assert.ok(snippet.includes("architecture"));
    assert.ok(snippet.startsWith("…"));
    assert.ok(snippet.endsWith("…"));
  });

  it("formats ISO dates cleanly without timezone off-by-one shift", () => {
    assert.equal(formatSearchDateLabel("2026-08-15T23:59:59.000Z"), "August 15, 2026");
  });
});

describe("PHASE 9B: Global Search Engine & Filters Integration Tests", () => {
  const calPersonal: LocalCalendar = {
    id: "cal-pers",
    userId: "user-1",
    name: "Personal",
    emoji: "🏠",
    color: "#7C3AED",
    description: "Family and personal memories",
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
    description: "Meetings and project deadlines",
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
    name: "Archived 2020",
    emoji: "📦",
    color: "#64748B",
    isDefault: false,
    isVisible: false,
    isArchived: true,
    createdAt: "2020-01-01T00:00:00.000Z",
    localUpdatedAt: "2020-01-01T00:00:00.000Z",
    serverUpdatedAt: null,
    syncStatus: "synced",
    deletedAt: null,
  };

  const today = new Date();
  const todayStr = dateKey(today);
  const pastStr = dateKey(new Date(today.getTime() - 86400000 * 10));
  const futureStr = dateKey(new Date(today.getTime() + 86400000 * 10));

  const baseEvents: LocalEvent[] = [
    {
      id: "evt-1",
      userId: "user-1",
      calendarId: "cal-pers",
      title: "Birthday Celebration",
      description: "Dinner with friends",
      location: "Goa Beach Shack",
      emoji: "🎂",
      highlightColor: "#7C3AED",
      highlightStyle: "background",
      startAt: `${futureStr}T19:00:00.000Z`,
      endAt: `${futureStr}T22:00:00.000Z`,
      isAllDay: false,
      priority: "high",
      createdAt: "2026-01-01T00:00:00.000Z",
      localUpdatedAt: "2026-01-01T00:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced",
      deletedAt: null,
    },
    {
      id: "evt-2",
      userId: "user-1",
      calendarId: "cal-work",
      title: "Placement Meeting",
      description: "Prepare C++ and system design slides",
      location: "Auditorium Hall",
      emoji: "💼",
      highlightColor: "#0EA5E9",
      highlightStyle: "background",
      startAt: `${todayStr}T10:00:00.000Z`,
      endAt: `${todayStr}T11:30:00.000Z`,
      isAllDay: false,
      priority: "urgent",
      createdAt: "2026-01-01T00:00:00.000Z",
      localUpdatedAt: "2026-01-01T00:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced",
      deletedAt: null,
    },
    {
      id: "evt-3",
      userId: "user-1",
      calendarId: "cal-pers",
      title: "College Presentation",
      description: "Final year project demo",
      location: "Main Campus",
      emoji: "🎓",
      highlightColor: "#16A34A",
      highlightStyle: "background",
      startAt: `${pastStr}T09:00:00.000Z`,
      endAt: `${pastStr}T10:00:00.000Z`,
      isAllDay: false,
      priority: "medium",
      createdAt: "2026-01-01T00:00:00.000Z",
      localUpdatedAt: "2026-01-01T00:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced",
      deletedAt: null,
    },
    {
      id: "evt-deleted",
      userId: "user-1",
      calendarId: "cal-pers",
      title: "Deleted Birthday",
      highlightColor: "#7C3AED",
      highlightStyle: "background",
      startAt: `${futureStr}T10:00:00.000Z`,
      endAt: `${futureStr}T11:00:00.000Z`,
      isAllDay: false,
      priority: "low",
      createdAt: "2026-01-01T00:00:00.000Z",
      localUpdatedAt: "2026-01-01T00:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "pending",
      deletedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "evt-archived-cal",
      userId: "user-1",
      calendarId: "cal-arch",
      title: "Archived Birthday",
      highlightColor: "#64748B",
      highlightStyle: "background",
      startAt: "2020-05-01T10:00:00.000Z",
      endAt: "2020-05-01T11:00:00.000Z",
      isAllDay: false,
      priority: "low",
      createdAt: "2020-01-01T00:00:00.000Z",
      localUpdatedAt: "2020-01-01T00:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced",
      deletedAt: null,
    },
  ];

  const baseNotes: LocalNote[] = [
    {
      id: "note-1",
      userId: "user-1",
      calendarId: "cal-pers",
      title: "Morning Thoughts",
      content: "<p>Today was one of the most <strong>memorable</strong> days in Goa!</p>",
      date: `${pastStr}T08:00:00.000Z`,
      createdAt: "2026-01-01T08:00:00.000Z",
      localUpdatedAt: "2026-01-01T08:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced",
      deletedAt: null,
    },
    {
      id: "note-2",
      userId: "user-1",
      calendarId: "cal-work",
      title: "Sprint Retrospective",
      content: "<p>Discussed offline sync improvements and search performance.</p>",
      date: `${todayStr}T17:00:00.000Z`,
      createdAt: "2026-01-01T17:00:00.000Z",
      localUpdatedAt: "2026-01-01T17:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced",
      deletedAt: null,
    },
  ];

  const dataset: SearchDataset = {
    events: baseEvents,
    notes: baseNotes,
    calendars: [calPersonal, calWork, calArchived],
  };

  it("searches across events (title, description, location), notes (title, content), and calendars", () => {
    // Match "Goa" across event location and note content
    const goaRes = executeSearchOnDataset(dataset, {
      query: "goa",
      category: "all",
      timeHorizon: "all",
      calendarId: null,
    });
    assert.equal(goaRes.totalEvents, 1);
    assert.equal(goaRes.events[0].title, "Birthday Celebration");
    assert.equal(goaRes.totalNotes, 1);
    assert.equal(goaRes.notes[0].title, "Morning Thoughts");

    // Match "Birthday" — excludes deleted and archived calendar events
    const bdayRes = executeSearchOnDataset(dataset, {
      query: "birthday",
      category: "all",
      timeHorizon: "all",
      calendarId: null,
    });
    assert.equal(bdayRes.totalEvents, 1);
    assert.equal(bdayRes.events[0].id, "evt-1");

    // Match calendar by description
    const calRes = executeSearchOnDataset(dataset, {
      query: "deadlines",
      category: "all",
      timeHorizon: "all",
      calendarId: null,
    });
    assert.equal(calRes.totalCalendars, 1);
    assert.equal(calRes.calendars[0].name, "Work");
    assert.equal(calRes.calendars[0].itemCount, 2); // 1 work event + 1 work note
  });

  it("supports partial matches, case-insensitive matching, and special characters", () => {
    const res = executeSearchOnDataset(dataset, {
      query: "c++ SLIDES",
      category: "all",
      timeHorizon: "all",
      calendarId: null,
    });
    assert.equal(res.totalEvents, 1);
    assert.equal(res.events[0].id, "evt-2");
  });

  it("combines category, timeHorizon, calendarId, and custom date range filters", () => {
    // Today + Work calendar
    const todayWork = executeSearchOnDataset(dataset, {
      query: "",
      category: "all",
      timeHorizon: "today",
      calendarId: "cal-work",
    });
    assert.equal(todayWork.totalEvents, 1);
    assert.equal(todayWork.events[0].id, "evt-2");
    assert.equal(todayWork.totalNotes, 1);
    assert.equal(todayWork.notes[0].id, "note-2");

    // Past + Events only
    const pastEvents = executeSearchOnDataset(dataset, {
      query: "",
      category: "events",
      timeHorizon: "past",
      calendarId: null,
    });
    assert.equal(pastEvents.totalEvents, 1);
    assert.equal(pastEvents.events[0].id, "evt-3");
    assert.equal(pastEvents.totalNotes, 0);

    // Upcoming + Personal
    const upcomingPers = executeSearchOnDataset(dataset, {
      query: "",
      category: "all",
      timeHorizon: "upcoming",
      calendarId: "cal-pers",
    });
    assert.equal(upcomingPers.totalEvents, 1);
    assert.equal(upcomingPers.events[0].id, "evt-1");
  });

  it("reflects offline creations, edits, and deletions immediately", () => {
    const mutatedDataset: SearchDataset = {
      ...dataset,
      events: [
        ...dataset.events.filter((e) => e.id !== "evt-1"),
        {
          id: "evt-offline-new",
          userId: "user-1",
          calendarId: "cal-pers",
          title: "Offline Train Ticket",
          location: "Central Station",
          highlightColor: "#7C3AED",
          highlightStyle: "background",
          startAt: `${futureStr}T06:00:00.000Z`,
          endAt: `${futureStr}T07:00:00.000Z`,
          isAllDay: false,
          priority: "high",
          createdAt: "2026-01-01T00:00:00.000Z",
          localUpdatedAt: "2026-01-01T00:00:00.000Z",
          serverUpdatedAt: null,
          syncStatus: "pending",
          deletedAt: null,
        },
      ],
    };

    const offlineRes = executeSearchOnDataset(mutatedDataset, {
      query: "Train",
      category: "all",
      timeHorizon: "all",
      calendarId: null,
    });
    assert.equal(offlineRes.totalEvents, 1);
    assert.equal(offlineRes.events[0].id, "evt-offline-new");
  });

  it("paginates large datasets cleanly and remains fast", () => {
    const manyEvents: LocalEvent[] = Array.from({ length: 1200 }, (_, i) => ({
      id: `evt-bulk-${i}`,
      userId: "user-1",
      calendarId: "cal-pers",
      title: `Archive Milestone #${i}`,
      description: i % 2 === 0 ? "Special milestone entry" : "Regular entry",
      highlightColor: "#7C3AED",
      highlightStyle: "background",
      startAt: "2024-06-15T10:00:00.000Z",
      endAt: "2024-06-15T11:00:00.000Z",
      isAllDay: false,
      priority: "low",
      createdAt: "2024-06-15T10:00:00.000Z",
      localUpdatedAt: "2024-06-15T10:00:00.000Z",
      serverUpdatedAt: null,
      syncStatus: "synced",
      deletedAt: null,
    }));

    const startMs = performance.now();
    const res = executeSearchOnDataset(
      { events: manyEvents, notes: [], calendars: [calPersonal] },
      {
        query: "Special milestone",
        category: "events",
        timeHorizon: "all",
        calendarId: null,
        limit: 20,
      }
    );
    const elapsedMs = performance.now() - startMs;

    assert.equal(res.totalEvents, 600);
    assert.equal(res.events.length, 20);
    assert.equal(res.hasMoreEvents, true);
    assert.ok(elapsedMs < 200, `Search took too long: ${elapsedMs}ms`);
  });

  it("manages local-only recent search history with deduplication and clearing", () => {
    // Provide minimal in-memory localStorage mock for Node test environment
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    };

    const uid = "test-user";
    recentSearchHistory.clear(uid);
    assert.deepEqual(recentSearchHistory.get(uid), []);

    recentSearchHistory.add(uid, "Birthday");
    recentSearchHistory.add(uid, "Goa");
    recentSearchHistory.add(uid, "birthday"); // case-insensitive dedupe moves to front
    assert.deepEqual(recentSearchHistory.get(uid), ["birthday", "Goa"]);

    recentSearchHistory.remove(uid, "Goa");
    assert.deepEqual(recentSearchHistory.get(uid), ["birthday"]);

    recentSearchHistory.clear(uid);
    assert.deepEqual(recentSearchHistory.get(uid), []);
  });
});
