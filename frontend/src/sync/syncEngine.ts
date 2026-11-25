/**
 * Sync Engine
 *
 * Orchestrates bidirectional synchronization between IndexedDB and the backend.
 *
 * Architecture:
 * - Singleton class, NOT a React component
 * - Triggered by: app start, login, online event, after local mutations
 * - Push phase: batch-sends pending local operations to POST /api/v1/sync/push
 * - Pull phase: fetches server changes since lastSyncCursor from POST /api/v1/sync/pull
 * - On pull completion, invalidates TanStack Query keys to trigger UI re-render
 * - Retry with exponential backoff (1s → 2s → 4s → 8s → 32s cap)
 * - Idempotent: operationId on each queue entry prevents server-side duplicates
 */

import type { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { connectivityMonitor } from "./connectivityMonitor";
import { useUserStore } from "@/store";
import {
  syncRepository,
  calendarRepository,
  eventRepository,
  noteRepository,
  settingsRepository,
  reminderRepository,
} from "@/db/repositories";
import type {
  LocalCalendar,
  LocalEvent,
  SyncQueueEntry,
} from "@/db";

// ─── Types shared with the backend sync API ────────────────────────────────

export interface SyncPushOperation {
  operationId: string;
  operation: string;
  entityId: string;
  payload: Record<string, unknown>;
}

export interface SyncPushResult {
  operationId: string;
  status: "applied" | "conflict" | "error" | "duplicate";
  serverEntity?: Record<string, unknown>;
  errorMessage?: string;
}

export interface SyncPushResponse {
  results: SyncPushResult[];
}

export interface SyncPullResponse {
  changes: {
    calendars: Record<string, unknown>[];
    events: Record<string, unknown>[];
    notes: Record<string, unknown>[];
    reminders?: Record<string, unknown>[];
    settings: Record<string, unknown> | null;
  };
  nextCursor: string;
  hasMore: boolean;
}

export type SyncEngineStatus = "idle" | "syncing" | "error" | "offline";

type SyncStatusListener = (status: SyncEngineStatus, pendingCount: number, lastSyncedAt: string | null) => void;

// ─── Backoff helper ────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 10;

// ─── Sync Engine class ─────────────────────────────────────────────────────

class SyncEngine {
  private _queryClient: QueryClient | null = null;
  private _userId: string | null = null;
  private _status: SyncEngineStatus = "idle";
  private _pendingCount = 0;
  private _lastSyncedAt: string | null = null;
  private _isSyncing = false;
  private _pendingTrigger = false;
  private _listeners: Set<SyncStatusListener> = new Set();
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;
  private _periodicTimer: ReturnType<typeof setInterval> | null = null;

  /** Called once from main.tsx after auth is ready */
  init(queryClient: QueryClient, userId: string | null) {
    this._queryClient = queryClient;
    this._userId = userId;

    // Subscribe to connectivity monitor
    connectivityMonitor.subscribe((online) => {
      if (online) {
        this.trigger("connectivity-restored");
      } else {
        this._setStatus("offline");
      }
    });

    // Browser Online & Focus event listeners (triggers automatic sync as soon as internet is restored)
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.trigger("window-online");
      });

      window.addEventListener("focus", () => {
        this.trigger("window-focus");
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.trigger("tab-visible");
        }
      });
    }

    // Service Worker Message listener for background sync events
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "TRIGGER_SYNC") {
          this.trigger("sw-background-sync");
        }
      });
    }

    // Frequent background sync check every 15 seconds
    if (this._periodicTimer) clearInterval(this._periodicTimer);
    this._periodicTimer = setInterval(() => {
      this.trigger("periodic-15s");
    }, 15 * 1000);
  }

  setUserId(userId: string | null) {
    this._userId = userId;
  }

  subscribe(listener: SyncStatusListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  get status(): SyncEngineStatus { return this._status; }
  get pendingCount(): number { return this._pendingCount; }
  get lastSyncedAt(): string | null { return this._lastSyncedAt; }

  /** Register OS/browser background sync task via ServiceWorker */
  registerBackgroundSync(): void {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready
        .then((reg) => {
          // @ts-expect-error SyncManager standard interface
          return reg.sync?.register("doodo-sync");
        })
        .catch(() => {});
    }
  }

  /** Public helper to apply pull changes (used by initialSync) */
  async applyPullChanges(changes: SyncPullResponse["changes"]): Promise<void> {
    await this._applyPullChanges(changes);
  }

  /** Trigger a sync cycle. Non-blocking — returns immediately. */
  trigger(_reason?: string): void {
    if (this._isSyncing) {
      this._pendingTrigger = true;
      return;
    }
    this._runSync().catch(() => {});
  }

  /** Flush all pending operations to the server (used by Background Sync SW) */
  async flush(): Promise<void> {
    return this._runSync();
  }

  private async _runSync(): Promise<void> {
    if (!this._queryClient) return;

    if (!this._userId) {
      this._userId = (await syncRepository.getSyncedUserId()) ?? useUserStore.getState().user?.id ?? null;
    }
    if (!this._userId) return;

    if (this._isSyncing) {
      this._pendingTrigger = true;
      return;
    }

    const online = await connectivityMonitor.ping();
    if (!online) {
      this._setStatus("offline");
      return;
    }

    this._isSyncing = true;
    this._setStatus("syncing");

    try {
      await this._pushPhase();
      await this._pullPhase();

      this._lastSyncedAt = new Date().toISOString();
      this._pendingCount = await syncRepository.getPendingCount();
      this._setStatus("idle");

      // Invalidate queries so hooks re-read updated IndexedDB data
      this._queryClient.invalidateQueries();

      // Prune completed queue entries
      await syncRepository.pruneCompleted();
    } catch (err) {
      console.warn("[SyncEngine] Sync failed:", err);
      this._setStatus("error");
    } finally {
      this._isSyncing = false;
      if (this._pendingTrigger) {
        this._pendingTrigger = false;
        const remainingPending = await syncRepository.getPendingCount();
        if (remainingPending > 0) {
          setTimeout(() => this.trigger("deferred"), 1000);
        }
      }
    }
  }

  // ─── Push phase ──────────────────────────────────────────────────────────

  private async _pushPhase(): Promise<void> {
    const pending = await syncRepository.getPending();
    if (pending.length === 0) return;

    const BATCH_SIZE = 50;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      await this._pushBatch(batch);
    }
  }

  private async _pushBatch(ops: SyncQueueEntry[]): Promise<void> {
    // Mark all as processing
    for (const op of ops) {
      if (op.id !== undefined) await syncRepository.markProcessing(op.id);
    }

    const payload: SyncPushOperation[] = ops.map((op) => ({
      operationId: op.operationId,
      operation: op.operation,
      entityId: op.entityId,
      payload: op.payload,
    }));

    let response: SyncPushResponse;
    try {
      const res = await apiClient.post<{ success: boolean; data: SyncPushResponse }>(
        "/sync/push",
        { operations: payload }
      );
      response = res.data;
    } catch (err: unknown) {
      // Network error — revert all to pending for retry
      for (const op of ops) {
        if (op.id !== undefined) {
          await syncRepository.markRetryable(op.id, "Network error");
        }
      }
      throw err; // propagate to abort this sync cycle
    }

    // Process per-operation results
    const resultMap = new Map(response.results.map((r) => [r.operationId, r]));

    for (const op of ops) {
      const result = resultMap.get(op.operationId);
      if (!result) continue;
      if (op.id === undefined) continue;

      switch (result.status) {
        case "applied":
        case "duplicate":
          await syncRepository.markDone(op.id);
          // Update local entity's serverUpdatedAt
          if (result.serverEntity) {
            await this._applyServerEntity(op.operation, result.serverEntity);
          }
          break;

        case "conflict":
          await syncRepository.markConflict(op.id, result.errorMessage ?? "Conflict");
          // Apply server version (last-write-wins for non-note entities)
          if (result.serverEntity) {
            await this._resolveConflict(op.operation, op.entityId, result.serverEntity);
          }
          break;

        case "error":
          if (op.attemptCount >= MAX_ATTEMPTS) {
            await syncRepository.markFailed(op.id, result.errorMessage ?? "Max retries exceeded");
          } else {
            await syncRepository.markRetryable(op.id, result.errorMessage ?? "Server error");
          }
          break;
      }
    }
  }

  private async _applyServerEntity(
    operation: string,
    serverEntity: Record<string, unknown>
  ): Promise<void> {
    const id = serverEntity.id as string;
    const serverUpdatedAt = serverEntity.updatedAt as string;

    if (operation.includes("_EVENT")) {
      await eventRepository.markSynced(id, serverUpdatedAt);
    } else if (operation.includes("_NOTE")) {
      await noteRepository.markSynced(id, serverUpdatedAt);
    } else if (operation.includes("_CALENDAR")) {
      await calendarRepository.markSynced(id, serverUpdatedAt);
    } else if (operation.includes("_REMINDER")) {
      await reminderRepository.markSynced(id, serverUpdatedAt);
    } else if (operation === "UPDATE_SETTINGS") {
      if (this._userId) {
        await settingsRepository.markSynced(this._userId, serverUpdatedAt);
      }
    }
  }

  private async _resolveConflict(
    operation: string,
    entityId: string,
    serverEntity: Record<string, unknown>
  ): Promise<void> {
    // Strategy: for notes → mark conflict for user to resolve manually.
    // For everything else → accept server version (last-write-wins).
    if (operation.includes("_NOTE")) {
      await noteRepository.markConflict(entityId);
      // Don't overwrite note content — let user resolve
    } else if (operation.includes("_EVENT")) {
      const local = await eventRepository.getById(entityId);
      if (local) {
        await eventRepository.upsert({
          ...local,
          ...(serverEntity as Partial<LocalEvent>),
          syncStatus: "synced",
          serverUpdatedAt: serverEntity.updatedAt as string,
          localUpdatedAt: new Date().toISOString(),
        });
      }
    } else if (operation.includes("_CALENDAR")) {
      const local = await calendarRepository.getById(entityId);
      if (local) {
        await calendarRepository.upsert({
          ...local,
          ...(serverEntity as Partial<LocalCalendar>),
          syncStatus: "synced",
          serverUpdatedAt: serverEntity.updatedAt as string,
          localUpdatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // ─── Pull phase ───────────────────────────────────────────────────────────

  private async _pullPhase(): Promise<void> {
    let cursor = await syncRepository.getCursor();
    let hasMore = true;
    let iterations = 0;
    const MAX_ITERATIONS = 50;

    while (hasMore && iterations < MAX_ITERATIONS) {
      iterations++;
      const res = await apiClient.post<{ success: boolean; data: SyncPullResponse }>(
        "/sync/pull",
        { cursor, limit: 200 }
      );
      const { changes, nextCursor, hasMore: more } = res.data;

      const totalChanges =
        changes.calendars.length +
        changes.events.length +
        changes.notes.length +
        (changes.settings ? 1 : 0);

      await this._applyPullChanges(changes);

      // Stop if no new cursor, unchanged cursor, or 0 changes returned
      if (!more || nextCursor === cursor || totalChanges === 0) {
        if (nextCursor) await syncRepository.setCursor(nextCursor);
        break;
      }

      cursor = nextCursor;
      hasMore = more;
    }

    if (cursor) {
      await syncRepository.setCursor(cursor);
    }
  }

  private async _applyPullChanges(
    changes: SyncPullResponse["changes"]
  ): Promise<void> {
    if (!this._userId) return;
    const now = new Date().toISOString();

    // Calendars
    for (const raw of changes.calendars) {
      const cal = raw as Record<string, unknown>;
      const existing = await calendarRepository.getById(cal.id as string);
      if (existing?.syncStatus === "pending") {
        // Local has pending changes — server data will be reconciled in next push
        continue;
      }
      await calendarRepository.upsert({
        id: cal.id as string,
        userId: this._userId,
        name: cal.name as string,
        emoji: cal.emoji as string,
        color: cal.color as string,
        description: cal.description as string | undefined,
        isDefault: cal.isDefault as boolean,
        isVisible: cal.isVisible as boolean,
        isArchived: cal.isArchived as boolean,
        createdAt: cal.createdAt as string,
        localUpdatedAt: now,
        serverUpdatedAt: cal.updatedAt as string,
        syncStatus: "synced",
        deletedAt: (cal.deletedAt as string | null) ?? null,
      });
    }

    // Events
    for (const raw of changes.events) {
      const ev = raw as Record<string, unknown>;
      const existing = await eventRepository.getById(ev.id as string);
      if (existing?.syncStatus === "pending") continue;

      await eventRepository.upsert({
        id: ev.id as string,
        userId: this._userId,
        calendarId: ev.calendarId as string,
        title: ev.title as string,
        description: ev.description as string | undefined,
        emoji: ev.emoji as string | undefined,
        highlightColor: ev.highlightColor as string,
        highlightStyle: ev.highlightStyle as string,
        startAt: ev.startAt as string,
        endAt: ev.endAt as string,
        isAllDay: ev.isAllDay as boolean,
        location: ev.location as string | undefined,
        priority: ev.priority as string,
        recurrenceRule: ev.recurrenceRule as string | undefined,
        recurrenceEnd: ev.recurrenceEnd as string | undefined,
        createdAt: ev.createdAt as string,
        localUpdatedAt: now,
        serverUpdatedAt: ev.updatedAt as string,
        syncStatus: "synced",
        deletedAt: (ev.deletedAt as string | null) ?? null,
      });
    }

    // Notes
    for (const raw of changes.notes) {
      const note = raw as Record<string, unknown>;
      const existing = await noteRepository.getById(note.id as string);
      // For notes: if local has pending changes, keep them (user wins for own device)
      if (existing?.syncStatus === "pending") continue;
      // If conflict, skip pull (user must resolve manually)
      if (existing?.syncStatus === "conflict") continue;

      await noteRepository.upsert({
        id: note.id as string,
        userId: this._userId,
        calendarId: note.calendarId as string | undefined,
        title: note.title as string | undefined,
        content: note.content as string,
        date: note.date as string,
        createdAt: note.createdAt as string,
        localUpdatedAt: now,
        serverUpdatedAt: note.updatedAt as string,
        syncStatus: "synced",
        deletedAt: (note.deletedAt as string | null) ?? null,
      });
    }

    // Reminders
    if (changes.reminders) {
      for (const raw of changes.reminders) {
        const rem = raw as Record<string, unknown>;
        const existing = await reminderRepository.getById(rem.id as string);
        if (existing?.syncStatus === "pending") continue;

        await reminderRepository.upsert({
          id: rem.id as string,
          userId: this._userId,
          eventId: rem.eventId as string,
          type: rem.type as string,
          scheduledAt: rem.scheduledAt as string,
          timezone: rem.timezone as string,
          enabled: rem.enabled as boolean,
          status: rem.status as string,
          sentAt: (rem.sentAt as string | null) ?? null,
          createdAt: rem.createdAt as string,
          localUpdatedAt: now,
          serverUpdatedAt: rem.updatedAt as string,
          syncStatus: "synced",
        });
      }
    }

    // Settings
    if (changes.settings) {
      const s = changes.settings as Record<string, unknown>;
      const existing = await settingsRepository.get(this._userId);
      if (!existing || existing.syncStatus !== "pending") {
        await settingsRepository.upsert({
          userId: this._userId,
          theme: s.theme as string,
          language: s.language as string,
          dateFormat: s.dateFormat as string,
          timeFormat: s.timeFormat as string,
          weekStartsOn: s.weekStartsOn as number,
          notificationsEnabled: s.notificationsEnabled as boolean,
          localUpdatedAt: now,
          serverUpdatedAt: s.updatedAt as string,
          syncStatus: "synced",
        });
      }
    }
  }

  private _setStatus(status: SyncEngineStatus): void {
    this._status = status;
    this._listeners.forEach((l) => l(status, this._pendingCount, this._lastSyncedAt));
  }

  /** Call on logout — stop periodic sync */
  destroy(): void {
    if (this._periodicTimer) clearInterval(this._periodicTimer);
    if (this._retryTimer) clearTimeout(this._retryTimer);
  }
}

/** Singleton sync engine */
export const syncEngine = new SyncEngine();
