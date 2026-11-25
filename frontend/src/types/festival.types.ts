// ─── Festival Types ───────────────────────────────────────────────────────────

export type FestivalCategory =
  | "national"
  | "state"
  | "hindu"
  | "muslim"
  | "christian"
  | "regional"
  | "international";

export type FestivalRegion =
  | "india"
  | "tamil-nadu"
  | "kerala"
  | "karnataka"
  | "andhra-pradesh"
  | "maharashtra"
  | "global";

export interface FestivalRecord {
  id: string;               // e.g. "pongal-2026"
  name: string;             // "Pongal"
  localizedName?: string;   // "பொங்கல்"
  date: string;             // "YYYY-MM-DD" (always date-only, no timezone component)
  year: number;
  category: FestivalCategory;
  emoji: string;
  description: string;
  region: FestivalRegion | FestivalRegion[];
  source: string;           // Data provenance / reference
  isEstimate: boolean;      // true when date is computed from lunar calendar approximation
  durationDays?: number;    // 1 = single day (default). Multi-day = >1
  relatedIds?: string[];    // IDs of related records (e.g. other days in same festival)
  isMultiDay?: boolean;
}

// LocalFestival is FestivalRecord stored in Dexie — same shape, no extra fields needed
export type LocalFestival = FestivalRecord;

export interface FestivalFilters {
  year?: number;
  month?: number; // 0-indexed (JS Date month)
  category?: FestivalCategory | "all";
  region?: FestivalRegion | "all";
  dateStart?: string; // YYYY-MM-DD
  dateEnd?: string;   // YYYY-MM-DD
}

export interface FestivalSettings {
  festivalsEnabled: boolean;
  festivalsShowNational: boolean;
  festivalsShowState: boolean;
  festivalsShowHindu: boolean;
  festivalsShowMuslim: boolean;
  festivalsShowChristian: boolean;
  festivalsShowRegional: boolean;
  festivalsShowInternational: boolean;
  festivalsRegion: FestivalRegion | "all";
}
