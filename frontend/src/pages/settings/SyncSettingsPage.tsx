import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  WifiOff,
  AlertTriangle,
  Calendar,
  FileText,
  Bell,
  Layers,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { syncRepository } from "@/db/repositories/syncRepository";
import type { SyncQueueEntry } from "@/db";

export function SyncSettingsPage() {
  const { pendingCount, isOffline, isSyncing, lastSyncedAt, triggerSync } = useSyncStatus();
  const [logs, setLogs] = useState<SyncQueueEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "done" | "error">("all");
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await syncRepository.getAllAuditLogs();
      setLogs(data);
    } catch {
      // ignore read error
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const timer = setInterval(fetchLogs, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleClearDone = async () => {
    await syncRepository.clearCompletedLogs();
    await fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "pending") return log.status === "pending" || log.status === "processing";
    if (filter === "done") return log.status === "done";
    if (filter === "error") return log.status === "failed" || log.status === "conflict";
    return true;
  });

  const counts = {
    all: logs.length,
    pending: logs.filter((l) => l.status === "pending" || l.status === "processing").length,
    done: logs.filter((l) => l.status === "done").length,
    error: logs.filter((l) => l.status === "failed" || l.status === "conflict").length,
  };

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Link to="/settings">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sync & Cloud Data
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor offline connectivity, trigger manual syncs, and inspect audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isOffline ? (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                <WifiOff className="h-4 w-4" />
                <span>Offline Mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Online</span>
              </div>
            )}

            <Button
              onClick={() => {
                triggerSync();
                setTimeout(fetchLogs, 1500);
              }}
              disabled={isSyncing || isOffline}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </div>

        {/* Sync Summary Meta */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Pending Queue</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {pendingCount} {pendingCount === 1 ? "item" : "items"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Last Cloud Sync</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {lastSyncedAt
                ? new Date(lastSyncedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Not synced yet"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Audit Logs Count</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {logs.length} logged operations
            </p>
          </div>
        </div>
      </motion.div>

      {/* Audit Logs Section */}
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">Offline & Sync Audit Logs</CardTitle>
              <CardDescription>
                Inspect data entries made while offline and verify when they reached the cloud.
              </CardDescription>
            </div>

            {counts.done > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDone}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Completed Logs
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/40">
            <FilterTab
              label={`All (${counts.all})`}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterTab
              label={`Pending (${counts.pending})`}
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
            />
            <FilterTab
              label={`Synced (${counts.done})`}
              active={filter === "done"}
              onClick={() => setFilter("done")}
            />
            {counts.error > 0 && (
              <FilterTab
                label={`Errors (${counts.error})`}
                active={filter === "error"}
                onClick={() => setFilter("error")}
                danger
              />
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
              No sync log entries match this filter.
            </div>
          ) : (
            <div className="grid gap-2.5">
              {filteredLogs.map((log) => (
                <AuditLogCard key={log.id ?? log.operationId} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
  danger = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? danger
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
          : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function AuditLogCard({ log }: { log: SyncQueueEntry }) {
  const getOpBadge = (op: string) => {
    if (op.includes("EVENT"))
      return { icon: Calendar, label: "Event", color: "text-purple-500 bg-purple-500/10" };
    if (op.includes("NOTE"))
      return { icon: FileText, label: "Note", color: "text-blue-500 bg-blue-500/10" };
    if (op.includes("CALENDAR"))
      return { icon: Layers, label: "Calendar", color: "text-amber-500 bg-amber-500/10" };
    if (op.includes("REMINDER"))
      return { icon: Bell, label: "Reminder", color: "text-pink-500 bg-pink-500/10" };
    return { icon: Settings, label: "Settings", color: "text-gray-500 bg-gray-500/10" };
  };

  const badge = getOpBadge(log.operation);
  const Icon = badge.icon;

  const getActionLabel = (op: string) => {
    if (op.startsWith("CREATE")) return "Created";
    if (op.startsWith("UPDATE")) return "Updated";
    if (op.startsWith("DELETE")) return "Deleted";
    return op;
  };

  const getPayloadSummary = (log: SyncQueueEntry) => {
    const p = log.payload as Record<string, unknown>;
    if (p?.title) return `"${p.title}"`;
    if (p?.name) return `"${p.name}"`;
    if (p?.content) return `"${(p.content as string).slice(0, 30)}..."`;
    return `ID: ${log.entityId.slice(0, 8)}...`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/15 p-3 text-xs transition hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${badge.color}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <div className="flex items-center gap-2 font-medium text-foreground">
            <span>
              {getActionLabel(log.operation)} {badge.label}
            </span>
            <span className="text-muted-foreground font-normal">
              {getPayloadSummary(log)}
            </span>
          </div>
          <p className="mt-0.5 text-muted-foreground text-[11px]">
            Queued: {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {log.status === "done" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Synced
          </span>
        )}

        {log.status === "pending" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-amber-600 dark:text-amber-400 font-semibold">
            <Clock className="h-3 w-3" /> Pending Sync
          </span>
        )}

        {log.status === "processing" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-sky-600 dark:text-sky-400 font-semibold">
            <RefreshCw className="h-3 w-3 animate-spin" /> In Flight
          </span>
        )}

        {(log.status === "failed" || log.status === "conflict") && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-destructive font-semibold"
            title={log.errorMessage ?? "Sync error"}
          >
            <AlertTriangle className="h-3 w-3" /> Sync Failed
          </span>
        )}
      </div>
    </div>
  );
}
