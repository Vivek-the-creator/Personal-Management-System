import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import type {
  SyncPushOperation,
  SyncPushResult,
  SyncPullResponse,
} from "./sync.types";

/**
 * Handle push operations from client sync engine.
 * Validates ownership, checks idempotency, applies operations, and returns results.
 */
export async function processPush(
  userId: string,
  operations: SyncPushOperation[]
): Promise<SyncPushResult[]> {
  const results: SyncPushResult[] = [];

  for (const op of operations) {
    try {
      // 1. Check Idempotency (already processed this operationId?)
      const existingIdempotency = await prisma.syncIdempotency.findUnique({
        where: { operationId: op.operationId },
      });

      if (existingIdempotency) {
        const cachedResult: SyncPushResult = JSON.parse(existingIdempotency.resultJson);
        results.push(cachedResult);
        continue;
      }

      // 2. Process Operation
      const result = await applyOperation(userId, op);

      // 3. Save Idempotency Result
      await prisma.syncIdempotency.create({
        data: {
          operationId: op.operationId,
          userId,
          resultJson: JSON.stringify(result),
        },
      });

      results.push(result);
    } catch (err: any) {
      const errorResult: SyncPushResult = {
        operationId: op.operationId,
        status: "error",
        errorMessage: err.message || "Internal server error during sync operation",
      };
      results.push(errorResult);
    }
  }

  return results;
}

async function applyOperation(
  userId: string,
  op: SyncPushOperation
): Promise<SyncPushResult> {
  const { operation, entityId, payload } = op;

  switch (operation) {
    case "CREATE_EVENT": {
      const cal = await prisma.calendar.findFirst({
        where: { id: payload.calendarId as string, userId },
      });
      if (!cal) {
        return { operationId: op.operationId, status: "error", errorMessage: "Calendar not found or not owned" };
      }

      const created = await prisma.event.create({
        data: {
          id: entityId, // Client-generated CUID/UUID
          userId,
          calendarId: payload.calendarId as string,
          title: (payload.title as string).trim(),
          description: (payload.description as string)?.trim() || null,
          emoji: (payload.emoji as string)?.trim() || null,
          highlightColor: (payload.highlightColor as string) || "#7C3AED",
          highlightStyle: (payload.highlightStyle as string) || "background",
          startAt: new Date(payload.startAt as string),
          endAt: new Date(payload.endAt as string),
          isAllDay: (payload.isAllDay as boolean) ?? true,
          location: (payload.location as string)?.trim() || null,
          priority: (payload.priority as string) || "medium",
          recurrenceRule: (payload.recurrenceRule as string)?.trim() || null,
          recurrenceEnd: payload.recurrenceEnd ? new Date(payload.recurrenceEnd as string) : null,
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatEvent(created),
      };
    }

    case "UPDATE_EVENT": {
      const existing = await prisma.event.findFirst({
        where: { id: entityId, userId, deletedAt: null },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "error", errorMessage: "Event not found" };
      }

      const updated = await prisma.event.update({
        where: { id: entityId },
        data: {
          ...(payload.calendarId !== undefined && { calendarId: payload.calendarId as string }),
          ...(payload.title !== undefined && { title: (payload.title as string).trim() }),
          ...(payload.description !== undefined && { description: (payload.description as string)?.trim() || null }),
          ...(payload.emoji !== undefined && { emoji: (payload.emoji as string)?.trim() || null }),
          ...(payload.highlightColor !== undefined && { highlightColor: payload.highlightColor as string }),
          ...(payload.highlightStyle !== undefined && { highlightStyle: payload.highlightStyle as string }),
          ...(payload.startAt !== undefined && { startAt: new Date(payload.startAt as string) }),
          ...(payload.endAt !== undefined && { endAt: new Date(payload.endAt as string) }),
          ...(payload.isAllDay !== undefined && { isAllDay: payload.isAllDay as boolean }),
          ...(payload.location !== undefined && { location: (payload.location as string)?.trim() || null }),
          ...(payload.priority !== undefined && { priority: payload.priority as string }),
          ...(payload.recurrenceRule !== undefined && { recurrenceRule: (payload.recurrenceRule as string)?.trim() || null }),
          ...(payload.recurrenceEnd !== undefined && {
            recurrenceEnd: payload.recurrenceEnd ? new Date(payload.recurrenceEnd as string) : null,
          }),
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatEvent(updated),
      };
    }

    case "DELETE_EVENT": {
      const existing = await prisma.event.findFirst({
        where: { id: entityId, userId },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "applied" }; // Already gone
      }

      await prisma.event.update({
        where: { id: entityId },
        data: { deletedAt: new Date() },
      });

      return { operationId: op.operationId, status: "applied" };
    }

    case "CREATE_NOTE": {
      const created = await prisma.note.create({
        data: {
          id: entityId,
          userId,
          calendarId: (payload.calendarId as string) || null,
          title: (payload.title as string)?.trim() || null,
          content: payload.content as string,
          date: new Date(payload.date as string),
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatNote(created),
      };
    }

    case "UPDATE_NOTE": {
      const existing = await prisma.note.findFirst({
        where: { id: entityId, userId, deletedAt: null },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "error", errorMessage: "Note not found" };
      }

      const updated = await prisma.note.update({
        where: { id: entityId },
        data: {
          ...(payload.calendarId !== undefined && { calendarId: (payload.calendarId as string) || null }),
          ...(payload.title !== undefined && { title: (payload.title as string)?.trim() || null }),
          ...(payload.content !== undefined && { content: payload.content as string }),
          ...(payload.date !== undefined && { date: new Date(payload.date as string) }),
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatNote(updated),
      };
    }

    case "DELETE_NOTE": {
      const existing = await prisma.note.findFirst({
        where: { id: entityId, userId },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "applied" };
      }

      await prisma.note.update({
        where: { id: entityId },
        data: { deletedAt: new Date() },
      });

      return { operationId: op.operationId, status: "applied" };
    }

    case "CREATE_CALENDAR": {
      const name = (payload.name as string).trim();
      const existingName = await prisma.calendar.findFirst({
        where: { userId, name },
      });
      if (existingName) {
        return { operationId: op.operationId, status: "error", errorMessage: "A calendar with this name already exists" };
      }

      const shouldBeDefault = (payload.isDefault as boolean) ?? false;
      if (shouldBeDefault) {
        await prisma.calendar.updateMany({
          where: { userId, isDefault: true, id: { not: entityId } },
          data: { isDefault: false },
        });
      }

      const created = await prisma.calendar.create({
        data: {
          id: entityId,
          userId,
          name,
          emoji: (payload.emoji as string) || "⭐",
          color: (payload.color as string) || "sky",
          description: (payload.description as string)?.trim() || null,
          isDefault: shouldBeDefault,
          isVisible: (payload.isVisible as boolean) ?? true,
          isArchived: (payload.isArchived as boolean) ?? false,
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatCalendar(created),
      };
    }

    case "UPDATE_CALENDAR": {
      const existing = await prisma.calendar.findFirst({
        where: { id: entityId, userId },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "error", errorMessage: "Calendar not found" };
      }

      if (payload.name && (payload.name as string).trim() !== existing.name) {
        const name = (payload.name as string).trim();
        const existingName = await prisma.calendar.findFirst({
          where: { userId, name, id: { not: entityId } },
        });
        if (existingName) {
          return { operationId: op.operationId, status: "error", errorMessage: "A calendar with this name already exists" };
        }
      }

      if (payload.isDefault === true) {
        await prisma.calendar.updateMany({
          where: { userId, isDefault: true, id: { not: entityId } },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.calendar.update({
        where: { id: entityId },
        data: {
          ...(payload.name !== undefined && { name: (payload.name as string).trim() }),
          ...(payload.emoji !== undefined && { emoji: payload.emoji as string }),
          ...(payload.color !== undefined && { color: payload.color as string }),
          ...(payload.description !== undefined && { description: (payload.description as string)?.trim() || null }),
          ...(payload.isDefault !== undefined && { isDefault: payload.isDefault as boolean }),
          ...(payload.isVisible !== undefined && { isVisible: payload.isVisible as boolean }),
          ...(payload.isArchived !== undefined && { isArchived: payload.isArchived as boolean }),
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatCalendar(updated),
      };
    }

    case "DELETE_CALENDAR": {
      const existing = await prisma.calendar.findFirst({
        where: { id: entityId, userId },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "applied" };
      }

      await prisma.calendar.delete({
        where: { id: entityId },
      });

      return { operationId: op.operationId, status: "applied" };
    }

    case "UPDATE_SETTINGS": {
      const updated = await prisma.userSettings.upsert({
        where: { userId },
        update: payload,
        create: { userId, ...payload },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: {
          theme: updated.theme,
          language: updated.language,
          dateFormat: updated.dateFormat,
          timeFormat: updated.timeFormat,
          weekStartsOn: updated.weekStartsOn,
          notificationsEnabled: updated.notificationsEnabled,
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    }

    case "CREATE_REMINDER": {
      const created = await prisma.reminder.create({
        data: {
          id: entityId,
          userId,
          eventId: payload.eventId as string,
          type: (payload.type as string) || "start_of_day",
          scheduledAt: new Date(payload.scheduledAt as string),
          timezone: (payload.timezone as string) || "UTC",
          enabled: (payload.enabled as boolean) ?? true,
          status: "PENDING",
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatReminder(created),
      };
    }

    case "UPDATE_REMINDER": {
      const existing = await prisma.reminder.findFirst({
        where: { id: entityId, userId },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "error", errorMessage: "Reminder not found" };
      }

      const updated = await prisma.reminder.update({
        where: { id: entityId },
        data: {
          ...(payload.type !== undefined && { type: payload.type as string }),
          ...(payload.scheduledAt !== undefined && { scheduledAt: new Date(payload.scheduledAt as string) }),
          ...(payload.timezone !== undefined && { timezone: payload.timezone as string }),
          ...(payload.enabled !== undefined && { enabled: payload.enabled as boolean }),
          ...(payload.status !== undefined && { status: payload.status as string }),
        },
      });

      return {
        operationId: op.operationId,
        status: "applied",
        serverEntity: formatReminder(updated),
      };
    }

    case "DELETE_REMINDER": {
      const existing = await prisma.reminder.findFirst({
        where: { id: entityId, userId },
      });

      if (!existing) {
        return { operationId: op.operationId, status: "applied" };
      }

      await prisma.reminder.delete({ where: { id: entityId } });
      return { operationId: op.operationId, status: "applied" };
    }

    default:
      return { operationId: op.operationId, status: "error", errorMessage: `Unknown operation: ${operation}` };
  }
}

/**
 * Handle incremental pull requests from client sync engine.
 * Returns all entities updated or deleted after cursor.
 */
export async function processPull(
  userId: string,
  cursor: string | null,
  limit: number = 200
): Promise<SyncPullResponse> {
  const cursorDate = cursor ? new Date(cursor) : new Date(0);

  const calendars = await prisma.calendar.findMany({
    where: {
      userId,
      updatedAt: { gt: cursorDate },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  const events = await prisma.event.findMany({
    where: {
      userId,
      OR: [
        { updatedAt: { gt: cursorDate } },
        { deletedAt: { gt: cursorDate } },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  const notes = await prisma.note.findMany({
    where: {
      userId,
      OR: [
        { updatedAt: { gt: cursorDate } },
        { deletedAt: { gt: cursorDate } },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  const settings = await prisma.userSettings.findFirst({
    where: {
      userId,
      updatedAt: { gt: cursorDate },
    },
  });

  // Calculate next cursor
  let maxDate = cursorDate;
  const updateMax = (d: Date) => { if (d > maxDate) maxDate = d; };

  calendars.forEach((c) => updateMax(c.updatedAt));
  events.forEach((e) => {
    updateMax(e.updatedAt);
    if (e.deletedAt) updateMax(e.deletedAt);
  });
  notes.forEach((n) => {
    updateMax(n.updatedAt);
    if (n.deletedAt) updateMax(n.deletedAt);
  });
  if (settings) updateMax(settings.updatedAt);

  const hasMore =
    calendars.length === limit || events.length === limit || notes.length === limit;

  return {
    changes: {
      calendars: calendars.map(formatCalendar),
      events: events.map(formatEvent),
      notes: notes.map(formatNote),
      settings: settings
        ? {
            theme: settings.theme,
            language: settings.language,
            dateFormat: settings.dateFormat,
            timeFormat: settings.timeFormat,
            weekStartsOn: settings.weekStartsOn,
            notificationsEnabled: settings.notificationsEnabled,
            updatedAt: settings.updatedAt.toISOString(),
          }
        : null,
    },
    nextCursor: maxDate.toISOString(),
    hasMore,
  };
}

function formatCalendar(c: any) {
  return {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
    description: c.description ?? undefined,
    isDefault: c.isDefault,
    isVisible: c.isVisible,
    isArchived: c.isArchived,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function formatEvent(e: any) {
  return {
    id: e.id,
    calendarId: e.calendarId,
    title: e.title,
    description: e.description ?? undefined,
    emoji: e.emoji ?? undefined,
    highlightColor: e.highlightColor,
    highlightStyle: e.highlightStyle,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    isAllDay: e.isAllDay,
    location: e.location ?? undefined,
    priority: e.priority,
    recurrenceRule: e.recurrenceRule ?? undefined,
    recurrenceEnd: e.recurrenceEnd ? e.recurrenceEnd.toISOString() : undefined,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
  };
}

function formatNote(n: any) {
  return {
    id: n.id,
    calendarId: n.calendarId ?? undefined,
    title: n.title ?? undefined,
    content: n.content,
    date: n.date.toISOString(),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    deletedAt: n.deletedAt ? n.deletedAt.toISOString() : null,
  };
}

function formatReminder(r: any) {
  return {
    id: r.id,
    eventId: r.eventId,
    type: r.type,
    scheduledAt: r.scheduledAt.toISOString(),
    timezone: r.timezone,
    enabled: r.enabled,
    status: r.status,
    sentAt: r.sentAt ? r.sentAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
