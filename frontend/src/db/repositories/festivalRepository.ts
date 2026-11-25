import { db, type LocalFestival } from "@/db";
import type {
  FestivalCategory,
  FestivalFilters,
  FestivalRegion,
  FestivalSettings,
} from "@/types/festival.types";
import {
  DEFAULT_FESTIVAL_SETTINGS,
  deduplicateFestivals,
  filterFestivals,
} from "@/utils/festival.utils";

const FESTIVAL_SETTINGS_META_KEY = "festival_settings_v1";
const FESTIVAL_SEED_VERSION_KEY = "festival_seed_version";
const CURRENT_SEED_VERSION = "2026-11-25-v1";

export const festivalRepository = {
  /**
   * Seed festival reference records into IndexedDB if empty or outdated.
   * Uses bulkPut with deduplication so repeated calls never create duplicates.
   */
  async seedIfNeeded(records: LocalFestival[]): Promise<void> {
    const [count, versionMeta] = await Promise.all([
      db.festivals.count(),
      db.syncMeta.get(FESTIVAL_SEED_VERSION_KEY),
    ]);

    if (count > 0 && versionMeta?.value === CURRENT_SEED_VERSION) {
      return;
    }

    const deduped = deduplicateFestivals(records);
    await db.transaction("rw", db.festivals, db.syncMeta, async () => {
      await db.festivals.bulkPut(deduped);
      await db.syncMeta.put({
        key: FESTIVAL_SEED_VERSION_KEY,
        value: CURRENT_SEED_VERSION,
      });
    });
  },

  /** Return all festivals in IndexedDB */
  async listAll(): Promise<LocalFestival[]> {
    return db.festivals.orderBy("date").toArray();
  },

  /** Return festivals for a given year */
  async listByYear(year: number): Promise<LocalFestival[]> {
    return db.festivals.where("year").equals(year).sortBy("date");
  },

  /** Return festivals on a specific YYYY-MM-DD date */
  async listByDate(date: string): Promise<LocalFestival[]> {
    return db.festivals.where("date").equals(date).toArray();
  },

  /** Return festivals within an inclusive YYYY-MM-DD date range */
  async listByDateRange(start: string, end: string): Promise<LocalFestival[]> {
    return db.festivals
      .where("date")
      .between(start, end, true, true)
      .sortBy("date");
  },

  /** Return festivals matching filters & settings */
  async query(
    filters: FestivalFilters = {},
    settings?: FestivalSettings
  ): Promise<LocalFestival[]> {
    const all =
      filters.year !== undefined
        ? await this.listByYear(filters.year)
        : filters.dateStart && filters.dateEnd
          ? await this.listByDateRange(filters.dateStart, filters.dateEnd)
          : await this.listAll();
    return filterFestivals(all, filters, settings);
  },

  /** Return festivals by category for a year */
  async listByCategory(
    year: number,
    category: FestivalCategory
  ): Promise<LocalFestival[]> {
    const byYear = await this.listByYear(year);
    return filterFestivals(byYear, { category });
  },

  /** Return festivals by region for a year */
  async listByRegion(
    year: number,
    region: FestivalRegion
  ): Promise<LocalFestival[]> {
    const byYear = await this.listByYear(year);
    return filterFestivals(byYear, { region });
  },

  /** Get a single festival by ID */
  async getById(id: string): Promise<LocalFestival | undefined> {
    return db.festivals.get(id);
  },

  /** Read persisted festival visibility settings from syncMeta */
  async getSettings(): Promise<FestivalSettings> {
    const meta = await db.syncMeta.get(FESTIVAL_SETTINGS_META_KEY);
    if (!meta?.value) return { ...DEFAULT_FESTIVAL_SETTINGS };
    try {
      const parsed = JSON.parse(meta.value) as Partial<FestivalSettings>;
      return { ...DEFAULT_FESTIVAL_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_FESTIVAL_SETTINGS };
    }
  },

  /** Persist festival visibility settings to syncMeta */
  async saveSettings(partial: Partial<FestivalSettings>): Promise<FestivalSettings> {
    const current = await this.getSettings();
    const updated: FestivalSettings = { ...current, ...partial };
    await db.syncMeta.put({
      key: FESTIVAL_SETTINGS_META_KEY,
      value: JSON.stringify(updated),
    });
    return updated;
  },
};

