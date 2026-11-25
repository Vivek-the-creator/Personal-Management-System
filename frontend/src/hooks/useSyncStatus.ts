import { useEffect, useState } from "react";
import { syncEngine, type SyncEngineStatus } from "@/sync";

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncEngineStatus>(syncEngine.status);
  const [pendingCount, setPendingCount] = useState<number>(syncEngine.pendingCount);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(syncEngine.lastSyncedAt);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus, count, lastSynced) => {
      setStatus(newStatus);
      setPendingCount(count);
      setLastSyncedAt(lastSynced);
    });

    return unsubscribe;
  }, []);

  return {
    status,
    pendingCount,
    lastSyncedAt,
    isSyncing: status === "syncing",
    isOffline: status === "offline",
    isError: status === "error",
    isSynced: status === "idle" && pendingCount === 0,
    triggerSync: () => syncEngine.trigger("manual-ui"),
  };
}
