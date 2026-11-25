import { db, type LocalNote, type SyncStatus } from "@/db";

export const noteRepository = {
  /** List non-deleted notes for a user, optionally filtered by date range or specific date */
  async listByDateRange(
    userId: string,
    startDate?: string,
    endDate?: string,
    date?: string
  ): Promise<LocalNote[]> {
    const all = await db.notes.where("userId").equals(userId).toArray();

    return all.filter((n) => {
      if (n.deletedAt) return false;

      const noteDate = n.date.split("T")[0]; // YYYY-MM-DD

      if (date) {
        return noteDate === date.split("T")[0];
      }
      if (startDate && noteDate < startDate.split("T")[0]) return false;
      if (endDate && noteDate > endDate.split("T")[0]) return false;
      return true;
    });
  },

  /** Get a single note by ID */
  async getById(id: string): Promise<LocalNote | undefined> {
    return db.notes.get(id);
  },

  /** Insert or fully replace a note */
  async upsert(note: LocalNote): Promise<void> {
    await db.notes.put(note);
  },

  /** Batch upsert — used during sync pull */
  async batchUpsert(notes: LocalNote[]): Promise<void> {
    await db.notes.bulkPut(notes);
  },

  /** Soft-delete a note locally */
  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.notes.where("id").equals(id).modify({
      deletedAt: now,
      localUpdatedAt: now,
      syncStatus: "pending" as SyncStatus,
    });
  },

  /** Mark as synced with server timestamp */
  async markSynced(id: string, serverUpdatedAt: string): Promise<void> {
    await db.notes.where("id").equals(id).modify({
      syncStatus: "synced" as SyncStatus,
      serverUpdatedAt,
    });
  },

  /** Mark as conflict */
  async markConflict(id: string): Promise<void> {
    await db.notes.where("id").equals(id).modify({ syncStatus: "conflict" as SyncStatus });
  },

  /** Hard delete after server confirms deletion */
  async hardDelete(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  /** Get all pending notes for a user */
  async getPending(userId: string): Promise<LocalNote[]> {
    return db.notes.where("syncStatus").equals("pending").filter(n => n.userId === userId).toArray();
  },

  /** Clear all notes for a user (logout) */
  async clearForUser(userId: string): Promise<void> {
    await db.notes.where("userId").equals(userId).delete();
  },
};
