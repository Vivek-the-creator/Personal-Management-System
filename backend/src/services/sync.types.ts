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

export interface SyncPullResponse {
  changes: {
    calendars: Record<string, unknown>[];
    events: Record<string, unknown>[];
    notes: Record<string, unknown>[];
    settings: Record<string, unknown> | null;
  };
  nextCursor: string;
  hasMore: boolean;
}
