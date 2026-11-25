import { db, type LocalReminder, type SyncStatus } from "@/db";

export const reminderRepository = {
  /** Get all reminders for a specific event */
  async listByEventId(eventId: string): Promise<LocalReminder[]> {
    return db.reminders.where("eventId").equals(eventId).toArray();
  },

  /** Get single reminder by ID */
  async getById(id: string): Promise<LocalReminder | undefined> {
    return db.reminders.get(id);
  },

  /** Upsert a reminder record */
  async upsert(reminder: LocalReminder): Promise<void> {
    await db.reminders.put(reminder);
  },

  /** Batch upsert — used during sync pull */
  async batchUpsert(reminders: LocalReminder[]): Promise<void> {
    await db.reminders.bulkPut(reminders);
  },

  /** Hard-delete a reminder locally */
  async delete(id: string): Promise<void> {
    await db.reminders.delete(id);
  },

  /** Mark reminder as synced */
  async markSynced(id: string, serverUpdatedAt: string): Promise<void> {
    await db.reminders.where("id").equals(id).modify({
      syncStatus: "synced" as SyncStatus,
      serverUpdatedAt,
    });
  },

  /** Clear all reminders for a user (logout) */
  async clearForUser(userId: string): Promise<void> {
    await db.reminders.where("userId").equals(userId).delete();
  },
};
