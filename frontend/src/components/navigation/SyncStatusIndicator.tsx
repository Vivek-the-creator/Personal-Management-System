import { useSyncStatus } from "@/hooks/useSyncStatus";
import { CheckCircle2, RefreshCw, WifiOff, Clock, AlertTriangle } from "lucide-react";

export function SyncStatusIndicator() {
  const { pendingCount, isOffline, isSyncing, isError, triggerSync } = useSyncStatus();

  const isBrowserOffline = typeof navigator !== "undefined" && !navigator.onLine;

  // 1. Offline State (browser or monitor says offline)
  if (isOffline || isBrowserOffline) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
        title={pendingCount > 0 ? `${pendingCount} changes saved locally. Will sync when online.` : "App is working offline."}
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span>Offline</span>
      </div>
    );
  }

  // 2. Online & Has Pending Changes
  if (pendingCount > 0) {
    return (
      <button
        onClick={() => triggerSync()}
        className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
        title={`${pendingCount} pending offline changes. Click to sync now.`}
      >
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-amber-500" />
        )}
        <span>Sync Pending</span>
      </button>
    );
  }

  // 3. Online & Sync Error occurred
  if (isError) {
    return (
      <button
        onClick={() => triggerSync()}
        className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
        title="Sync error occurred. Click to retry."
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Sync Error</span>
      </button>
    );
  }

  // 4. Everything Synced
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
      title="All changes synchronized with cloud"
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      <span>Online</span>
    </div>
  );
}
