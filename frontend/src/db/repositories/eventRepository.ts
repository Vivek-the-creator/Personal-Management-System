import { db, type LocalEvent, type SyncStatus } from "@/db";

/** All event fields that can be written locally */
export type EventWritePayload = Omit<
  LocalEvent,
  "syncStatus" | "localUpdatedAt" | "serverUpdatedAt" | "deletedAt"
> & { serverUpdatedAt?: string | null };

export const eventRepository = {
  /** List non-deleted events for a user, optionally filtered by calendar and date range */
  async listByDateRange(
    userId: string,
    calendarId?: string | null,
    startDate?: string,
    endDate?: string
  ): Promise<LocalEvent[]> {
    let collection = db.events.where("userId").equals(userId);

    const all = await collection.toArray();

    return all.filter((e) => {
      if (e.deletedAt) return false;
      if (calendarId && e.calendarId !== calendarId) return false;
      if (startDate && e.endAt < startDate) return false;
      if (endDate && e.startAt > endDate) return false;
      return true;
    });
  },

  /** Get a single event by ID */
  async getById(id: string): Promise<LocalEvent | undefined> {
    return db.events.get(id);
  },

  /** Insert or fully replace a local event record */
  async upsert(event: LocalEvent): Promise<void> {
    await db.events.put(event);
  },

  /** Batch upsert — used during sync pull */
  async batchUpsert(events: LocalEvent[]): Promise<void> {
    await db.events.bulkPut(events);
  },

  /** Soft-delete an event locally (sets deletedAt, marks pending) */
  async softDelete(id: string, _userId: string): Promise<void> {
    const now = new Date().toISOString();
    await db.events.where("id").equals(id).modify({
      deletedAt: now,
      localUpdatedAt: now,
      syncStatus: "pending" as SyncStatus,
    });
  },

  /** Mark an event as synced with the latest server updatedAt */
  async markSynced(id: string, serverUpdatedAt: string): Promise<void> {
    await db.events.where("id").equals(id).modify({
      syncStatus: "synced" as SyncStatus,
      serverUpdatedAt,
    });
  },

  /** Mark as conflict */
  async markConflict(id: string): Promise<void> {
    await db.events.where("id").equals(id).modify({ syncStatus: "conflict" as SyncStatus });
  },

  /** Permanently remove a soft-deleted event after sync confirms deletion */
  async hardDelete(id: string): Promise<void> {
    await db.events.delete(id);
  },

  /** Get all events with pending sync status for the given user */
  async getPending(userId: string): Promise<LocalEvent[]> {
    return db.events.where("syncStatus").equals("pending").filter(e => e.userId === userId).toArray();
  },

  /** Clear all data for a specific userId (used on logout) */
  async clearForUser(userId: string): Promise<void> {
    await db.events.where("userId").equals(userId).delete();
  },
};
