/**
 * Initial Sync
 *
 * Downloads all user data from the server into IndexedDB on first login
 * or first use on a new device. After completion, sets lastSyncCursor
 * so future syncs are incremental.
 *
 * Sync window: 12 months back + all future events/notes.
 * Older data is fetched on-demand when the user navigates to past dates.
 */

import { apiClient } from "@/lib/api-client";
import { syncRepository } from "@/db/repositories/syncRepository";
import { syncEngine, type SyncPullResponse } from "./syncEngine";

interface InitialSyncOptions {
  userId: string;
  onProgress?: (stage: string) => void;
}

export async function runInitialSync({ userId, onProgress }: InitialSyncOptions): Promise<void> {
  // Already done for this user on this device?
  const storedUserId = await syncRepository.getSyncedUserId();
  const alreadyDone = await syncRepository.isInitialSyncDone();

  if (alreadyDone && storedUserId === userId) {
    return; // Skip — incremental sync will handle it
  }

  onProgress?.("Downloading your calendars and events...");

  // Full pull — no cursor (null means "all data")
  let cursor: string | null = null;
  let hasMore = true;
  let loopCount = 0;
  const MAX_LOOPS = 50;

  while (hasMore && loopCount < MAX_LOOPS) {
    loopCount++;
    const res: { success: boolean; data: SyncPullResponse } = await apiClient.post(
      "/sync/pull",
      { cursor, limit: 200 }
    );
    const { changes, nextCursor, hasMore: more } = res.data;

    // Apply downloaded data into IndexedDB!
    await syncEngine.applyPullChanges(changes);

    const totalChanges =
      changes.calendars.length +
      changes.events.length +
      changes.notes.length +
      (changes.settings ? 1 : 0);

    if (!more || nextCursor === cursor || totalChanges === 0) {
      if (nextCursor) await syncRepository.setCursor(nextCursor);
      break;
    }

    cursor = nextCursor;
    hasMore = more;
    onProgress?.("Syncing your data...");
  }

  // Set cursor so future syncs are incremental
  if (cursor) {
    await syncRepository.setCursor(cursor);
  }

  await syncRepository.markInitialSyncDone();
  await syncRepository.setSyncedUserId(userId);

  onProgress?.("Ready!");
}
