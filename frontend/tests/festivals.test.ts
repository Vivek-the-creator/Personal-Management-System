import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_FESTIVALS,
  INDIA_FESTIVALS_2025,
  INDIA_FESTIVALS_2026,
  INDIA_FESTIVALS_2027,
} from "../src/data/festivals";
import {
  DEFAULT_FESTIVAL_SETTINGS,
  deduplicateFestivals,
  filterFestivals,
  formatFestivalDate,
  getUpcomingFestivals,
  groupFestivalsByDate,
  parseFestivalDateParts,
} from "../src/utils/festival.utils";
import { executeSearchOnDataset } from "../src/db/repositories/searchRepository";
import type { FestivalRecord, FestivalSettings } from "../src/types/festival.types";

describe("PHASE 10: Festival & Holiday Calendar", () => {
  it("retrieves festivals by year, month, and date range accurately", () => {
    const jan2026 = filterFestivals(ALL_FESTIVALS, { year: 2026, month: 0 });
    assert.ok(jan2026.some((f) => f.id === "thai-pongal-2026"));
    assert.ok(jan2026.some((f) => f.id === "republic-day-2026"));
    assert.ok(jan2026.every((f) => f.date.startsWith("2026-01-")));

    const range = filterFestivals(ALL_FESTIVALS, {
      dateStart: "2026-08-01",
      dateEnd: "2026-08-31",
    });
    assert.ok(range.some((f) => f.id === "independence-day-2026"));
    assert.ok(range.some((f) => f.id === "vinayagar-chaturthi-2026"));
  });

  it("filters by category across national, state, hindu, muslim, christian, regional, international", () => {
    const national2026 = filterFestivals(ALL_FESTIVALS, {
      year: 2026,
      category: "national",
    });
    assert.ok(national2026.length >= 4);
    assert.ok(national2026.every((f) => f.category === "national"));

    const muslim2026 = filterFestivals(ALL_FESTIVALS, {
      year: 2026,
      category: "muslim",
    });
    assert.ok(muslim2026.some((f) => f.name === "Eid al-Fitr"));
    assert.ok(muslim2026.some((f) => f.name === "Eid al-Adha"));
    assert.ok(muslim2026.some((f) => f.name === "Milad-un-Nabi"));

    const state2026 = filterFestivals(ALL_FESTIVALS, {
      year: 2026,
      category: "state",
    });
    assert.ok(state2026.some((f) => f.id === "thiruvalluvar-day-2026"));
  });

  it("applies Tamil Nadu regional filtering (includes TN + pan-India, excludes Kerala-only)", () => {
    const tn2026 = filterFestivals(ALL_FESTIVALS, {
      year: 2026,
      region: "tamil-nadu",
    });
    assert.ok(tn2026.some((f) => f.id === "tamil-new-year-2026"));
    assert.ok(tn2026.some((f) => f.id === "independence-day-2026"));
    // Onam has region ["kerala", "india"] so it is included as India-wide;
    // test a strictly Kerala-only record to verify exclusion
    const keralaOnly: FestivalRecord = {
      id: "vishu-kerala-only-2026",
      name: "Vishu",
      date: "2026-04-14",
      year: 2026,
      category: "regional",
      emoji: "🌼",
      description: "Kerala New Year",
      region: "kerala",
      source: "Kerala Calendar",
      isEstimate: false,
    };
    const filtered = filterFestivals([...ALL_FESTIVALS, keralaOnly], {
      year: 2026,
      region: "tamil-nadu",
    });
    assert.equal(
      filtered.some((f) => f.id === "vishu-kerala-only-2026"),
      false
    );
  });

  it("groups multiple festivals occurring on the same date without overwriting", () => {
    const grouped = groupFestivalsByDate(INDIA_FESTIVALS_2026);
    // 2026-04-14 has Tamil New Year AND Dr. Ambedkar Jayanti
    const april14 = grouped["2026-04-14"] ?? [];
    assert.equal(april14.length, 2);
    assert.ok(april14.some((f) => f.name === "Tamil New Year"));
    assert.ok(april14.some((f) => f.name === "Dr. Ambedkar Jayanti"));

    // 2026-01-15 has Mattu Pongal AND Thiruvalluvar Day
    const jan15 = grouped["2026-01-15"] ?? [];
    assert.equal(jan15.length, 2);
  });

  it("stores year-specific variable lunar dates and provenance metadata", () => {
    const deepavali2025 = INDIA_FESTIVALS_2025.find((f) => f.name === "Deepavali");
    const deepavali2026 = INDIA_FESTIVALS_2026.find((f) => f.name === "Deepavali");
    const deepavali2027 = INDIA_FESTIVALS_2027.find((f) => f.name === "Deepavali");

    assert.ok(deepavali2025 && deepavali2026 && deepavali2027);
    assert.notEqual(deepavali2026.date, deepavali2027.date);
    assert.equal(deepavali2026.isEstimate, true);
    assert.ok(deepavali2026.source.length > 0);

    const eid2025 = INDIA_FESTIVALS_2025.find((f) => f.name === "Eid al-Fitr");
    const eid2026 = INDIA_FESTIVALS_2026.find((f) => f.name === "Eid al-Fitr");
    const eid2027 = INDIA_FESTIVALS_2027.find((f) => f.name === "Eid al-Fitr");
    assert.ok(eid2025 && eid2026 && eid2027);
    assert.notEqual(eid2025.date, eid2026.date);
    assert.notEqual(eid2026.date, eid2027.date);
  });

  it("respects FestivalSettings toggles for visibility and categories", () => {
    const disabled: FestivalSettings = {
      ...DEFAULT_FESTIVAL_SETTINGS,
      festivalsEnabled: false,
    };
    assert.equal(filterFestivals(ALL_FESTIVALS, { year: 2026 }, disabled).length, 0);

    const onlyNational: FestivalSettings = {
      ...DEFAULT_FESTIVAL_SETTINGS,
      festivalsShowState: false,
      festivalsShowHindu: false,
      festivalsShowMuslim: false,
      festivalsShowChristian: false,
      festivalsShowRegional: false,
      festivalsShowInternational: false,
    };
    const res = filterFestivals(ALL_FESTIVALS, { year: 2026 }, onlyNational);
    assert.ok(res.length > 0);
    assert.ok(res.every((f) => f.category === "national"));
  });

  it("parses and formats festival dates without timezone off-by-one shift", () => {
    const parts = parseFestivalDateParts("2026-01-14");
    assert.deepEqual(parts, { year: 2026, month: 0, day: 14 });
    const formatted = formatFestivalDate("2026-01-14");
    assert.ok(formatted.includes("Jan"));
    assert.ok(formatted.includes("14"));
    assert.ok(formatted.includes("2026"));
  });

  it("prevents duplicate festival IDs across the dataset and deduplicateFestivals helper", () => {
    const ids = ALL_FESTIVALS.map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length);

    const withDupes = [INDIA_FESTIVALS_2026[0], INDIA_FESTIVALS_2026[0], INDIA_FESTIVALS_2026[1]];
    const deduped = deduplicateFestivals(withDupes);
    assert.equal(deduped.length, 2);
  });

  it("returns upcoming festivals chronologically from a reference date", () => {
    const upcoming = getUpcomingFestivals(INDIA_FESTIVALS_2026, "2026-10-01", 3);
    assert.equal(upcoming.length, 3);
    assert.ok(upcoming[0].date >= "2026-10-01");
    assert.ok(upcoming[0].date <= upcoming[1].date);
    assert.ok(upcoming[1].date <= upcoming[2].date);
  });

  it("integrates festivals into global search results", () => {
    const results = executeSearchOnDataset(
      {
        events: [],
        notes: [],
        calendars: [],
        festivals: INDIA_FESTIVALS_2026,
      },
      {
        query: "Pongal",
        category: "all",
        timeHorizon: "all",
        calendarId: null,
      }
    );

    assert.ok(results.totalFestivals >= 3);
    assert.ok(results.festivals.some((f) => f.name === "Thai Pongal"));
    assert.ok(results.festivals.some((f) => f.name === "Mattu Pongal"));
    assert.ok(results.festivals.some((f) => f.name === "Kaanum Pongal"));
  });
});
