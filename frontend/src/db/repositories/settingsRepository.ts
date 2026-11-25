import { db, type LocalSettings, type SyncStatus } from "@/db";

export const settingsRepository = {
  /** Get settings for a user */
  async get(userId: string): Promise<LocalSettings | undefined> {
    return db.settings.get(userId);
  },

  /** Insert or replace settings */
  async upsert(settings: LocalSettings): Promise<void> {
    await db.settings.put(settings);
  },

  /** Partial update of settings */
  async update(userId: string, partial: Partial<Omit<LocalSettings, "userId">>): Promise<void> {
    const now = new Date().toISOString();
    await db.settings.where("userId").equals(userId).modify({
      ...partial,
      localUpdatedAt: now,
      syncStatus: "pending" as SyncStatus,
    });
  },

  /** Mark as synced */
  async markSynced(userId: string, serverUpdatedAt: string): Promise<void> {
    await db.settings.where("userId").equals(userId).modify({
      syncStatus: "synced" as SyncStatus,
      serverUpdatedAt,
    });
  },

  /** Clear settings for user (logout) */
  async clearForUser(userId: string): Promise<void> {
    await db.settings.delete(userId);
  },
};
