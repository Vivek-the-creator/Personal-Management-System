import {
  db,
  type LocalCalendar,
  type LocalEvent,
  type LocalFestival,
  type LocalNote,
} from "@/db";
import type {
  SearchCalendarResult,
  SearchEventResult,
  SearchFestivalResult,
  SearchFilters,
  SearchNoteResult,
  SearchResultsGrouped,
  SearchSuggestions,
} from "@/types/search.types";
import { FESTIVAL_CATEGORY_LABELS, formatFestivalDate } from "@/utils/festival.utils";
import { dateKey } from "@/utils/calendar";
import {
  computeRelevanceScore,
  extractSnippet,
  formatSearchDateLabel,
  matchesAllTokens,
  tokenizeQuery,
} from "@/utils/search.utils";
import {
  stripHtmlToText,
  toCalendarWorkspace,
  toEventItem,
  toNoteItem,
} from "@/utils/timeline.utils";

export interface SearchDataset {
  events: LocalEvent[];
  notes: LocalNote[];
  calendars: LocalCalendar[];
  festivals?: LocalFestival[];
}

const DEFAULT_RESULT_LIMIT = 20;

/**
 * Pure search execution over a dataset — shared by Dexie repository and unit/integration tests.
 * Designed cleanly so an optional backend PostgreSQL FTS provider can implement the same contract.
 */
export function executeSearchOnDataset(
  dataset: SearchDataset,
  filters: SearchFilters
): SearchResultsGrouped {
  const {
    query,
    category = "all",
    timeHorizon = "all",
    calendarId = null,
    customStartDate,
    customEndDate,
    limit = DEFAULT_RESULT_LIMIT,
  } = filters;

  const tokens = tokenizeQuery(query);
  const todayKey = dateKey(new Date());

  // 1. Active (non-deleted, non-archived) calendars map
  const activeCalendars = dataset.calendars.filter(
    (c) => !c.deletedAt && !c.isArchived
  );
  const calendarMap = new Map<string, LocalCalendar>();
  for (const cal of activeCalendars) {
    calendarMap.set(cal.id, cal);
  }

  // Track item counts per calendar for Calendar results
  const calendarItemCounts = new Map<string, number>();

  const matchedEvents: SearchEventResult[] = [];
  const matchedNotes: SearchNoteResult[] = [];
  const matchedCalendars: SearchCalendarResult[] = [];
  const matchedFestivals: SearchFestivalResult[] = [];

  // 2. Search Events
  for (const evt of dataset.events) {
    if (evt.deletedAt) continue;
    const cal = calendarMap.get(evt.calendarId);
    if (!cal) continue; // Exclude events in archived/deleted calendars

    calendarItemCounts.set(cal.id, (calendarItemCounts.get(cal.id) ?? 0) + 1);

    if (category !== "all" && category !== "events") continue;
    if (calendarId && evt.calendarId !== calendarId) continue;

    const evtDay = evt.startAt.split("T")[0];
    if (timeHorizon === "past" && evtDay >= todayKey) continue;
    if (timeHorizon === "today" && evtDay !== todayKey) continue;
    if (timeHorizon === "upcoming" && evtDay <= todayKey) continue;
    if (customStartDate && evtDay < customStartDate.split("T")[0]) continue;
    if (customEndDate && evtDay > customEndDate.split("T")[0]) continue;

    const formattedDate = formatSearchDateLabel(evt.startAt);
    if (
      tokens.length > 0 &&
      !matchesAllTokens(
        [
          evt.title,
          evt.description,
          evt.location,
          evt.emoji,
          formattedDate,
          evtDay,
          cal.name,
        ],
        tokens
      )
    ) {
      continue;
    }

    const score = computeRelevanceScore(
      evt.title,
      [evt.description, evt.location, cal.name, formattedDate, evt.emoji],
      tokens
    );

    matchedEvents.push({
      category: "event",
      id: evt.id,
      title: evt.title,
      description: evt.description,
      location: evt.location,
      emoji: evt.emoji,
      highlightColor: evt.highlightColor,
      startAt: evt.startAt,
      endAt: evt.endAt,
      isAllDay: evt.isAllDay,
      calendarId: evt.calendarId,
      calendarName: cal.name,
      calendarColor: cal.color,
      calendarEmoji: cal.emoji,
      score,
      rawEvent: toEventItem(evt),
    });
  }

  // 3. Search Notes
  for (const note of dataset.notes) {
    if (note.deletedAt) continue;
    const cal = note.calendarId ? calendarMap.get(note.calendarId) : undefined;
    if (note.calendarId && !cal) continue; // Exclude notes in archived/deleted calendars

    if (cal) {
      calendarItemCounts.set(cal.id, (calendarItemCounts.get(cal.id) ?? 0) + 1);
    }

    if (category !== "all" && category !== "notes") continue;
    if (calendarId && note.calendarId !== calendarId) continue;

    const noteDay = note.date.split("T")[0];
    if (timeHorizon === "past" && noteDay >= todayKey) continue;
    if (timeHorizon === "today" && noteDay !== todayKey) continue;
    if (timeHorizon === "upcoming" && noteDay <= todayKey) continue;
    if (customStartDate && noteDay < customStartDate.split("T")[0]) continue;
    if (customEndDate && noteDay > customEndDate.split("T")[0]) continue;

    const plainText = stripHtmlToText(note.content);
    const formattedDate = formatSearchDateLabel(note.date);

    if (
      tokens.length > 0 &&
      !matchesAllTokens(
        [note.title, plainText, formattedDate, noteDay, cal?.name],
        tokens
      )
    ) {
      continue;
    }

    const score = computeRelevanceScore(
      note.title || "Untitled Note",
      [plainText, cal?.name, formattedDate],
      tokens
    );

    matchedNotes.push({
      category: "note",
      id: note.id,
      title: note.title,
      plainTextContent: plainText,
      snippet: extractSnippet(plainText, tokens),
      date: note.date,
      updatedAt: note.localUpdatedAt,
      calendarId: note.calendarId,
      calendarName: cal?.name,
      calendarColor: cal?.color,
      calendarEmoji: cal?.emoji,
      score,
      rawNote: toNoteItem(note),
    });
  }

  // 4. Search Calendars
  if (category === "all" || category === "calendars") {
    for (const cal of activeCalendars) {
      if (calendarId && cal.id !== calendarId) continue;
      if (
        tokens.length > 0 &&
        !matchesAllTokens([cal.name, cal.description, cal.emoji], tokens)
      ) {
        continue;
      }

      const score = computeRelevanceScore(
        cal.name,
        [cal.description, cal.emoji],
        tokens
      );

      matchedCalendars.push({
        category: "calendar",
        id: cal.id,
        name: cal.name,
        description: cal.description,
        emoji: cal.emoji,
        color: cal.color,
        isArchived: cal.isArchived,
        itemCount: calendarItemCounts.get(cal.id) ?? 0,
        score,
        rawCalendar: toCalendarWorkspace(cal),
      });
    }
  }

  // 4b. Search Festivals (reference data — shown when no specific personal calendar filter is active)
  if ((category === "all" || category === "festivals") && !calendarId) {
    for (const fest of dataset.festivals ?? []) {
      const festDay = fest.date;
      if (timeHorizon === "past" && festDay >= todayKey) continue;
      if (timeHorizon === "today" && festDay !== todayKey) continue;
      if (timeHorizon === "upcoming" && festDay <= todayKey) continue;
      if (customStartDate && festDay < customStartDate.split("T")[0]) continue;
      if (customEndDate && festDay > customEndDate.split("T")[0]) continue;

      const formattedDate = formatFestivalDate(fest.date);
      const categoryLabel = FESTIVAL_CATEGORY_LABELS[fest.category];
      if (
        tokens.length > 0 &&
        !matchesAllTokens(
          [
            fest.name,
            fest.localizedName,
            fest.description,
            fest.emoji,
            formattedDate,
            fest.date,
            categoryLabel,
          ],
          tokens
        )
      ) {
        continue;
      }

      const score = computeRelevanceScore(
        fest.name,
        [fest.localizedName, fest.description, categoryLabel, formattedDate],
        tokens
      );

      matchedFestivals.push({
        category: "festival",
        id: fest.id,
        name: fest.name,
        localizedName: fest.localizedName,
        description: fest.description,
        emoji: fest.emoji,
        date: fest.date,
        festivalCategory: fest.category,
        score,
        rawFestival: fest,
      });
    }
  }

  // 5. Sort by relevance score descending, then date/name
  matchedEvents.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.startAt.localeCompare(a.startAt);
  });

  matchedNotes.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.date.localeCompare(a.date);
  });

  matchedCalendars.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  matchedFestivals.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.date.localeCompare(b.date);
  });

  const totalEvents = matchedEvents.length;
  const totalNotes = matchedNotes.length;
  const totalCalendars = matchedCalendars.length;
  const totalFestivals = matchedFestivals.length;

  const slicedEvents = matchedEvents.slice(0, limit);
  const slicedNotes = matchedNotes.slice(0, limit);
  const slicedFestivals = matchedFestivals.slice(0, limit);

  return {
    events: slicedEvents,
    notes: slicedNotes,
    calendars: matchedCalendars,
    festivals: slicedFestivals,
    totalEvents,
    totalNotes,
    totalCalendars,
    totalFestivals,
    totalCount: totalEvents + totalNotes + totalCalendars + totalFestivals,
    hasMoreEvents: totalEvents > limit,
    hasMoreNotes: totalNotes > limit,
  };
}

// ─── Recent Searches (Local-Only Privacy Preserving Storage) ──────────────────

const MAX_RECENT_SEARCHES = 8;

function getHistoryKey(userId: string): string {
  return `doodo-recent-searches-${userId}`;
}

export const recentSearchHistory = {
  get(userId: string): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(getHistoryKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  },

  add(userId: string, query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed) return this.get(userId);
    const existing = this.get(userId).filter(
      (q) => q.toLowerCase() !== trimmed.toLowerCase()
    );
    const next = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(getHistoryKey(userId), JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
    }
    return next;
  },

  remove(userId: string, query: string): string[] {
    const next = this.get(userId).filter((q) => q !== query);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(getHistoryKey(userId), JSON.stringify(next));
      } catch {
        // Ignore
      }
    }
    return next;
  },

  clear(userId: string): void {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(getHistoryKey(userId));
      } catch {
        // Ignore
      }
    }
  },
};

// ─── IndexedDB Search Repository ──────────────────────────────────────────────

export const searchRepository = {
  async loadDataset(userId: string, signal?: AbortSignal): Promise<SearchDataset> {
    if (signal?.aborted) {
      throw new DOMException("Search aborted", "AbortError");
    }

    const [events, notes, calendars, festivals] = await Promise.all([
      db.events.where("userId").equals(userId).toArray(),
      db.notes.where("userId").equals(userId).toArray(),
      db.calendars.where("userId").equals(userId).toArray(),
      db.festivals.toArray(),
    ]);

    if (signal?.aborted) {
      throw new DOMException("Search aborted", "AbortError");
    }

    return { events, notes, calendars, festivals };
  },

  async search(
    userId: string,
    filters: SearchFilters,
    signal?: AbortSignal
  ): Promise<SearchResultsGrouped> {
    const dataset = await this.loadDataset(userId, signal);
    return executeSearchOnDataset(dataset, filters);
  },

  async getSuggestions(userId: string): Promise<SearchSuggestions> {
    const dataset = await this.loadDataset(userId);
    const activeCalendars = dataset.calendars.filter(
      (c) => !c.deletedAt && !c.isArchived
    );
    const calendarMap = new Map(activeCalendars.map((c) => [c.id, c]));
    const todayKey = dateKey(new Date());

    // Top 3 recently updated notes
    const recentNotes: SearchNoteResult[] = dataset.notes
      .filter((n) => !n.deletedAt && (!n.calendarId || calendarMap.has(n.calendarId)))
      .sort((a, b) => b.localUpdatedAt.localeCompare(a.localUpdatedAt))
      .slice(0, 3)
      .map((note) => {
        const cal = note.calendarId ? calendarMap.get(note.calendarId) : undefined;
        const plain = stripHtmlToText(note.content);
        return {
          category: "note",
          id: note.id,
          title: note.title,
          plainTextContent: plain,
          snippet: extractSnippet(plain, [], 110),
          date: note.date,
          updatedAt: note.localUpdatedAt,
          calendarId: note.calendarId,
          calendarName: cal?.name,
          calendarColor: cal?.color,
          calendarEmoji: cal?.emoji,
          score: 0,
          rawNote: toNoteItem(note),
        };
      });

    // Top 4 upcoming events (today onwards)
    const upcomingEvents: SearchEventResult[] = dataset.events
      .filter((e) => !e.deletedAt && calendarMap.has(e.calendarId) && e.startAt.split("T")[0] >= todayKey)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 4)
      .map((evt) => {
        const cal = calendarMap.get(evt.calendarId)!;
        return {
          category: "event",
          id: evt.id,
          title: evt.title,
          description: evt.description,
          location: evt.location,
          emoji: evt.emoji,
          highlightColor: evt.highlightColor,
          startAt: evt.startAt,
          endAt: evt.endAt,
          isAllDay: evt.isAllDay,
          calendarId: evt.calendarId,
          calendarName: cal.name,
          calendarColor: cal.color,
          calendarEmoji: cal.emoji,
          score: 0,
          rawEvent: toEventItem(evt),
        };
      });

    return { recentNotes, upcomingEvents };
  },
};
