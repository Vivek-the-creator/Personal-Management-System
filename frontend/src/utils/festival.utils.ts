import type {
  FestivalCategory,
  FestivalFilters,
  FestivalRecord,
  FestivalRegion,
  FestivalSettings,
} from "@/types/festival.types";

export const DEFAULT_FESTIVAL_SETTINGS: FestivalSettings = {
  festivalsEnabled: true,
  festivalsShowNational: true,
  festivalsShowState: true,
  festivalsShowHindu: true,
  festivalsShowMuslim: true,
  festivalsShowChristian: true,
  festivalsShowRegional: true,
  festivalsShowInternational: false,
  festivalsRegion: "tamil-nadu",
};

export const FESTIVAL_CATEGORY_LABELS: Record<FestivalCategory, string> = {
  national: "National Holiday",
  state: "State Holiday",
  hindu: "Hindu Festival",
  muslim: "Muslim Festival",
  christian: "Christian Festival",
  regional: "Regional & Cultural",
  international: "International",
};

export const FESTIVAL_REGION_LABELS: Record<FestivalRegion, string> = {
  india: "All India",
  "tamil-nadu": "Tamil Nadu",
  kerala: "Kerala",
  karnataka: "Karnataka",
  "andhra-pradesh": "Andhra Pradesh",
  maharashtra: "Maharashtra",
  global: "Global",
};

/**
 * Check if a festival matches a target region filter.
 * Note: "tamil-nadu" includes both "tamil-nadu" and "india" (national/pan-India) festivals.
 */
export function matchesFestivalRegion(
  festivalRegion: FestivalRegion | FestivalRegion[],
  targetRegion: FestivalRegion | "all"
): boolean {
  if (targetRegion === "all") return true;
  const regions = Array.isArray(festivalRegion) ? festivalRegion : [festivalRegion];
  if (regions.includes(targetRegion)) return true;
  // National / pan-India observances apply across Indian states
  if (
    targetRegion !== "global" &&
    regions.includes("india")
  ) {
    return true;
  }
  return false;
}

/**
 * Check whether a festival category is enabled under FestivalSettings.
 */
export function isCategoryEnabled(
  category: FestivalCategory,
  settings: FestivalSettings
): boolean {
  if (!settings.festivalsEnabled) return false;
  switch (category) {
    case "national":
      return settings.festivalsShowNational;
    case "state":
      return settings.festivalsShowState;
    case "hindu":
      return settings.festivalsShowHindu;
    case "muslim":
      return settings.festivalsShowMuslim;
    case "christian":
      return settings.festivalsShowChristian;
    case "regional":
      return settings.festivalsShowRegional;
    case "international":
      return settings.festivalsShowInternational;
    default:
      return true;
  }
}

/**
 * Deduplicate festival records by `id`, preserving first occurrence.
 */
export function deduplicateFestivals(records: FestivalRecord[]): FestivalRecord[] {
  const seen = new Set<string>();
  const result: FestivalRecord[] = [];
  for (const record of records) {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      result.push(record);
    }
  }
  return result;
}

/**
 * Parse a YYYY-MM-DD date-only string into { year, month (0-indexed), day }
 * without any local timezone shift.
 */
export function parseFestivalDateParts(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

/**
 * Format a YYYY-MM-DD festival date into a readable label without timezone shift.
 */
export function formatFestivalDate(dateStr: string): string {
  const { year, month, day } = parseFestivalDateParts(dateStr);
  const utcDate = new Date(Date.UTC(year, month, day));
  return utcDate.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Pure filter function for festivals — used by both UI hooks and unit tests.
 */
export function filterFestivals(
  records: FestivalRecord[],
  filters: FestivalFilters = {},
  settings?: FestivalSettings
): FestivalRecord[] {
  const deduped = deduplicateFestivals(records);

  return deduped
    .filter((f) => {
      if (settings) {
        if (!isCategoryEnabled(f.category, settings)) return false;
        if (
          settings.festivalsRegion !== "all" &&
          !matchesFestivalRegion(f.region, settings.festivalsRegion)
        ) {
          return false;
        }
      }

      if (filters.year !== undefined && f.year !== filters.year) {
        return false;
      }

      if (filters.month !== undefined) {
        const { month } = parseFestivalDateParts(f.date);
        if (month !== filters.month) return false;
      }

      if (filters.category && filters.category !== "all" && f.category !== filters.category) {
        return false;
      }

      if (
        filters.region &&
        filters.region !== "all" &&
        !matchesFestivalRegion(f.region, filters.region)
      ) {
        return false;
      }

      if (filters.dateStart && f.date < filters.dateStart) {
        return false;
      }

      if (filters.dateEnd && f.date > filters.dateEnd) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/**
 * Group festivals by YYYY-MM-DD date string.
 */
export function groupFestivalsByDate(
  records: FestivalRecord[]
): Record<string, FestivalRecord[]> {
  const map: Record<string, FestivalRecord[]> = {};
  for (const festival of records) {
    if (!map[festival.date]) {
      map[festival.date] = [];
    }
    map[festival.date].push(festival);
  }
  return map;
}

/**
 * Return upcoming festivals starting from `fromDateStr` (YYYY-MM-DD), sorted chronologically.
 */
export function getUpcomingFestivals(
  records: FestivalRecord[],
  fromDateStr: string,
  limit = 10
): FestivalRecord[] {
  return deduplicateFestivals(records)
    .filter((f) => f.date >= fromDateStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

