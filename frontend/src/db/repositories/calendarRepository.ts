import { db, type LocalCalendar, type SyncStatus } from "@/db";
import { syncRepository } from "./syncRepository";

export const calendarRepository = {
  /** List all non-deleted calendars for a user, enforcing single default calendar invariant */
  async listAll(userId: string): Promise<LocalCalendar[]> {
    const all = await db.calendars.where("userId").equals(userId).toArray();
    const active = all.filter((c) => !c.deletedAt);

    // Self-healing: Ensure at most 1 active calendar is default
    const defaults = active.filter((c) => c.isDefault);
    if (defaults.length > 1) {
      const now = new Date().toISOString();

      for (let i = 1; i < defaults.length; i++) {
        const c = defaults[i];
        c.isDefault = false;
        c.localUpdatedAt = now;
        c.syncStatus = "pending";
        await db.calendars.put(c);
        await syncRepository.enqueue({
          operationId: crypto.randomUUID(),
          operation: "UPDATE_CALENDAR",
          entityId: c.id,
          payload: { isDefault: false },
        });
      }
    }

    return active;
  },

  /** Check if a non-deleted calendar with the same name exists for this user */
  async existsByName(userId: string, name: string, ignoreCalendarId?: string): Promise<boolean> {
    const trimmed = name.trim().toLowerCase();
    const all = await this.listAll(userId);
    return all.some((c) => c.name.trim().toLowerCase() === trimmed && c.id !== ignoreCalendarId);
  },

  /** Clear default flag on all other calendars for a user except defaultCalendarId */
  async clearDefaultsExcept(userId: string, defaultCalendarId: string): Promise<void> {
    const now = new Date().toISOString();
    const all = await this.listAll(userId);

    for (const c of all) {
      if (c.id !== defaultCalendarId && c.isDefault) {
        c.isDefault = false;
        c.localUpdatedAt = now;
        c.syncStatus = "pending";
        await db.calendars.put(c);
        await syncRepository.enqueue({
          operationId: crypto.randomUUID(),
          operation: "UPDATE_CALENDAR",
          entityId: c.id,
          payload: { isDefault: false },
        });
      }
    }
  },

  /** Get a single calendar by ID */
  async getById(id: string): Promise<LocalCalendar | undefined> {
    return db.calendars.get(id);
  },

  /** Insert or fully replace a calendar */
  async upsert(calendar: LocalCalendar): Promise<void> {
    await db.calendars.put(calendar);
  },

  /** Batch upsert — used during sync pull */
  async batchUpsert(calendars: LocalCalendar[]): Promise<void> {
    await db.calendars.bulkPut(calendars);
  },

  /** Soft-delete a calendar locally */
  async softDelete(id: string, _userId: string): Promise<void> {
    const now = new Date().toISOString();
    await db.calendars.where("id").equals(id).modify({
      deletedAt: now,
      localUpdatedAt: now,
      syncStatus: "pending" as SyncStatus,
    });
  },

  /** Mark as synced with server timestamp */
  async markSynced(id: string, serverUpdatedAt: string): Promise<void> {
    await db.calendars.where("id").equals(id).modify({
      syncStatus: "synced" as SyncStatus,
      serverUpdatedAt,
    });
  },

  /** Hard-delete after confirmed by server */
  async hardDelete(id: string): Promise<void> {
    await db.calendars.delete(id);
  },

  /** Get all pending calendars for a user */
  async getPending(userId: string): Promise<LocalCalendar[]> {
    return db.calendars
      .where("syncStatus")
      .equals("pending")
      .filter((c) => c.userId === userId)
      .toArray();
  },

  /** Clear all calendars for user (logout) */
  async clearForUser(userId: string): Promise<void> {
    await db.calendars.where("userId").equals(userId).delete();
  },
};
