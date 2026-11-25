import { db, type SyncQueueEntry } from "@/db";
import { syncEngine } from "@/sync/syncEngine";

/** Create a new pending sync operation */
async function enqueue(
  entry: Omit<SyncQueueEntry, "id" | "status" | "attemptCount" | "lastAttemptAt" | "errorMessage" | "createdAt">
): Promise<void> {
  await db.syncQueue.add({
    ...entry,
    createdAt: new Date().toISOString(),
    status: "pending",
    attemptCount: 0,
    lastAttemptAt: null,
    errorMessage: null,
  });

  // Register browser/OS background sync task & trigger engine
  syncEngine.registerBackgroundSync();
  syncEngine.trigger("enqueue");
}

/** Get all pending operations in FIFO order */
async function getPending(): Promise<SyncQueueEntry[]> {
  return db.syncQueue.where("status").equals("pending").sortBy("createdAt");
}

/** Mark operation as processing (in-flight) */
async function markProcessing(id: number): Promise<void> {
  await db.syncQueue.update(id, {
    status: "processing",
    lastAttemptAt: new Date().toISOString(),
  });
}

/** Mark operation as successfully done */
async function markDone(id: number): Promise<void> {
  await db.syncQueue.update(id, { status: "done" });
}

/** Mark operation as permanently failed (do not retry) */
async function markFailed(id: number, errorMessage: string): Promise<void> {
  await db.syncQueue.where("id").equals(id).modify((entry) => {
    entry.status = "failed";
    entry.errorMessage = errorMessage;
    entry.attemptCount += 1;
  });
}

/** Increment attempt count and revert to pending (for retriable errors) */
async function markRetryable(id: number, errorMessage: string): Promise<void> {
  await db.syncQueue.where("id").equals(id).modify((entry) => {
    entry.status = "pending";
    entry.attemptCount += 1;
    entry.lastAttemptAt = new Date().toISOString();
    entry.errorMessage = errorMessage;
  });
}

/** Mark as conflict (needs user resolution) */
async function markConflict(id: number, errorMessage: string): Promise<void> {
  await db.syncQueue.update(id, {
    status: "conflict",
    errorMessage,
  });
}

/** Count of pending + processing operations */
async function getPendingCount(): Promise<number> {
  const pending = await db.syncQueue.where("status").equals("pending").count();
  const processing = await db.syncQueue.where("status").equals("processing").count();
  return pending + processing;
}

/** Check if a specific operationId is already in the queue (dedup) */
async function existsByOperationId(operationId: string): Promise<boolean> {
  const count = await db.syncQueue
    .where("operationId")
    .equals(operationId)
    .count();
  return count > 0;
}

/** Remove all done operations older than 24h (cleanup) */
async function pruneCompleted(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await db.syncQueue
    .where("status")
    .equals("done")
    .filter((e) => !!e.createdAt && e.createdAt < cutoff)
    .delete();
}

// ─── Sync Meta helpers ────────────────────────────────────────────────────────

async function getCursor(): Promise<string | null> {
  const meta = await db.syncMeta.get("lastSyncCursor");
  return meta?.value ?? null;
}

async function setCursor(cursor: string): Promise<void> {
  await db.syncMeta.put({ key: "lastSyncCursor", value: cursor });
}

async function isInitialSyncDone(): Promise<boolean> {
  const meta = await db.syncMeta.get("initialSyncDone");
  return meta?.value === "true";
}

async function markInitialSyncDone(): Promise<void> {
  await db.syncMeta.put({ key: "initialSyncDone", value: "true" });
}

async function getSyncedUserId(): Promise<string | null> {
  const meta = await db.syncMeta.get("userId");
  return meta?.value ?? null;
}

async function setSyncedUserId(userId: string): Promise<void> {
  await db.syncMeta.put({ key: "userId", value: userId });
}

/** Clear all sync metadata (used on logout) */
async function clearAll(): Promise<void> {
  await db.syncQueue.clear();
  await db.syncMeta.clear();
}

/** Get all audit log entries (pending, processing, done, failed, conflict) ordered by createdAt desc */
async function getAllAuditLogs(): Promise<SyncQueueEntry[]> {
  const all = await db.syncQueue.toArray();
  return all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

/** Clear all completed done audit log entries */
async function clearCompletedLogs(): Promise<void> {
  await db.syncQueue.where("status").equals("done").delete();
}

export const syncRepository = {
  enqueue,
  getPending,
  markProcessing,
  markDone,
  markFailed,
  markRetryable,
  markConflict,
  getPendingCount,
  existsByOperationId,
  pruneCompleted,
  getAllAuditLogs,
  clearCompletedLogs,
  getCursor,
  setCursor,
  isInitialSyncDone,
  markInitialSyncDone,
  getSyncedUserId,
  setSyncedUserId,
  clearAll,
};
