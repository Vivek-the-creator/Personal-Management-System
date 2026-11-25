import Dexie, { type EntityTable } from "dexie";
import type { FestivalRecord } from "@/types/festival.types";

export type LocalFestival = FestivalRecord;

// ─── Local entity shapes ──────────────────────────────────────────────────────

export type SyncStatus = "synced" | "pending" | "conflict" | "error";

export interface LocalCalendar {
  id: string;               // Same as server ID — UUID generated client-side for offline creates
  userId: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
  isDefault: boolean;
  isVisible: boolean;
  isArchived: boolean;
  createdAt: string;        // ISO
  localUpdatedAt: string;   // ISO — time of last local write
  serverUpdatedAt: string | null; // ISO — last known server updatedAt (for conflict detection)
  syncStatus: SyncStatus;
  deletedAt: string | null; // ISO — tombstone for soft-delete sync
}

export interface LocalEvent {
  id: string;
  userId: string;
  calendarId: string;
  title: string;
  description?: string;
  emoji?: string;
  highlightColor: string;
  highlightStyle: string;
  startAt: string;          // ISO
  endAt: string;            // ISO
  isAllDay: boolean;
  location?: string;
  priority: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;   // ISO
  createdAt: string;        // ISO
  localUpdatedAt: string;   // ISO
  serverUpdatedAt: string | null;
  syncStatus: SyncStatus;
  deletedAt: string | null; // ISO
}

export interface LocalNote {
  id: string;
  userId: string;
  calendarId?: string;
  title?: string;
  content: string;
  date: string;             // ISO — the calendar date this note belongs to
  createdAt: string;        // ISO
  localUpdatedAt: string;   // ISO
  serverUpdatedAt: string | null;
  syncStatus: SyncStatus;
  deletedAt: string | null;
}

export interface LocalSettings {
  userId: string;           // Primary key — one row per user
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  notificationsEnabled: boolean;
  localUpdatedAt: string;
  serverUpdatedAt: string | null;
  syncStatus: SyncStatus;
}

export interface LocalReminder {
  id: string;
  userId: string;
  eventId: string;
  type: string;
  scheduledAt: string;     // ISO
  timezone: string;
  enabled: boolean;
  status: string;          // PENDING | SENT | FAILED | EXPIRED | CANCELLED
  sentAt?: string | null;
  createdAt: string;
  localUpdatedAt: string;
  serverUpdatedAt: string | null;
  syncStatus: SyncStatus;
}

export type SyncOperationType =
  | "CREATE_CALENDAR" | "UPDATE_CALENDAR" | "DELETE_CALENDAR"
  | "CREATE_EVENT"    | "UPDATE_EVENT"    | "DELETE_EVENT"
  | "CREATE_NOTE"     | "UPDATE_NOTE"     | "DELETE_NOTE"
  | "CREATE_REMINDER" | "UPDATE_REMINDER" | "DELETE_REMINDER"
  | "UPDATE_SETTINGS";

export type SyncOperationStatus = "pending" | "processing" | "done" | "failed" | "conflict";

export interface SyncQueueEntry {
  id?: number;                    // Auto-increment — Dexie primary key
  operationId: string;            // UUID — idempotency key, stable across retries
  operation: SyncOperationType;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;              // ISO
  status: SyncOperationStatus;
  attemptCount: number;
  lastAttemptAt: string | null;   // ISO
  errorMessage: string | null;
}

export interface SyncMeta {
  key: string;   // e.g. "lastSyncCursor" | "userId" | "initialSyncDone"
  value: string;
}

// ─── Dexie Database ───────────────────────────────────────────────────────────

export class DoodoLocalDB extends Dexie {
  calendars!: EntityTable<LocalCalendar, "id">;
  events!: EntityTable<LocalEvent, "id">;
  notes!: EntityTable<LocalNote, "id">;
  settings!: EntityTable<LocalSettings, "userId">;
  reminders!: EntityTable<LocalReminder, "id">;
  festivals!: EntityTable<LocalFestival, "id">;
  syncQueue!: EntityTable<SyncQueueEntry, "id">;
  syncMeta!: EntityTable<SyncMeta, "key">;

  constructor() {
    super("DoodoLocalDB");

    this.version(1).stores({
      calendars: "id, userId, syncStatus, localUpdatedAt, deletedAt",
      events:    "id, userId, calendarId, startAt, endAt, syncStatus, localUpdatedAt, deletedAt",
      notes:     "id, userId, date, syncStatus, localUpdatedAt, deletedAt",
      settings:  "userId",
      syncQueue: "++id, operationId, operation, status, createdAt",
      syncMeta:  "key",
    });

    this.version(2).stores({
      calendars: "id, userId, syncStatus, localUpdatedAt, deletedAt",
      events:    "id, userId, calendarId, startAt, endAt, syncStatus, localUpdatedAt, deletedAt",
      notes:     "id, userId, date, syncStatus, localUpdatedAt, deletedAt",
      settings:  "userId",
      reminders: "id, userId, eventId, scheduledAt, status, syncStatus",
      syncQueue: "++id, operationId, operation, status, createdAt",
      syncMeta:  "key",
    });

    this.version(3).stores({
      calendars: "id, userId, syncStatus, localUpdatedAt, deletedAt",
      events:    "id, userId, calendarId, startAt, endAt, syncStatus, localUpdatedAt, deletedAt",
      notes:     "id, userId, date, syncStatus, localUpdatedAt, deletedAt",
      settings:  "userId",
      reminders: "id, userId, eventId, scheduledAt, status, syncStatus",
      festivals: "id, date, year, category, *region",
      syncQueue: "++id, operationId, operation, status, createdAt",
      syncMeta:  "key",
    });
  }
}

// Singleton — one DB instance for the whole app lifetime
export const db = new DoodoLocalDB();
