import { type Event } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import type {
  CreateEventBody,
  EventDTO,
  EventFilterParams,
  UpdateEventBody,
} from "../types/api.types";

function toEventDTO(event: Event): EventDTO {
  return {
    id: event.id,
    calendarId: event.calendarId,
    title: event.title,
    ...(event.description && { description: event.description }),
    ...(event.emoji && { emoji: event.emoji }),
    highlightColor: event.highlightColor,
    highlightStyle: event.highlightStyle,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    isAllDay: event.isAllDay,
    ...(event.location && { location: event.location }),
    priority: event.priority,
    ...(event.recurrenceRule && { recurrenceRule: event.recurrenceRule }),
    ...(event.recurrenceEnd && { recurrenceEnd: event.recurrenceEnd.toISOString() }),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

async function assertOwnedCalendar(userId: string, calendarId: string): Promise<void> {
  const calendar = await prisma.calendar.findFirst({
    where: { id: calendarId, userId },
  });
  if (!calendar) throw new AppError(404, "Calendar not found or not owned by user");
}

export async function listEvents(
  userId: string,
  params: EventFilterParams
): Promise<EventDTO[]> {
  const { calendarId, startDate, endDate, includeDeleted } = params;

  const where: any = {
    userId,
    ...(includeDeleted ? {} : { deletedAt: null }),
  };

  if (calendarId) {
    where.calendarId = calendarId;
  }

  if (startDate || endDate) {
    where.AND = [];
    if (startDate) {
      where.AND.push({ endAt: { gte: new Date(startDate) } });
    }
    if (endDate) {
      where.AND.push({ startAt: { lte: new Date(endDate) } });
    }
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: [{ startAt: "asc" }],
  });

  return events.map(toEventDTO);
}

export async function getEventById(userId: string, eventId: string): Promise<EventDTO> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId, deletedAt: null },
  });
  if (!event) throw new AppError(404, "Event not found");
  return toEventDTO(event);
}

export async function createEvent(
  userId: string,
  body: CreateEventBody
): Promise<EventDTO> {
  await assertOwnedCalendar(userId, body.calendarId);

  const startAt = new Date(body.startAt);
  const endAt = new Date(body.endAt);

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    throw new AppError(400, "Invalid start or end date format");
  }
  if (endAt < startAt) {
    throw new AppError(400, "End time cannot be earlier than start time");
  }

  const event = await prisma.event.create({
    data: {
      userId,
      calendarId: body.calendarId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      emoji: body.emoji?.trim() || null,
      highlightColor: body.highlightColor || "#7C3AED",
      highlightStyle: body.highlightStyle || "background",
      startAt,
      endAt,
      isAllDay: body.isAllDay ?? true,
      location: body.location?.trim() || null,
      priority: body.priority || "medium",
      recurrenceRule: body.recurrenceRule?.trim() || null,
      recurrenceEnd: body.recurrenceEnd ? new Date(body.recurrenceEnd) : null,
    },
  });

  return toEventDTO(event);
}

export async function updateEvent(
  userId: string,
  eventId: string,
  body: UpdateEventBody
): Promise<EventDTO> {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, userId, deletedAt: null },
  });

  if (!existing) throw new AppError(404, "Event not found");

  if (body.calendarId && body.calendarId !== existing.calendarId) {
    await assertOwnedCalendar(userId, body.calendarId);
  }

  const startAt = body.startAt ? new Date(body.startAt) : existing.startAt;
  const endAt = body.endAt ? new Date(body.endAt) : existing.endAt;

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    throw new AppError(400, "Invalid start or end date format");
  }
  if (endAt < startAt) {
    throw new AppError(400, "End time cannot be earlier than start time");
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(body.calendarId && { calendarId: body.calendarId }),
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description.trim() || null }),
      ...(body.emoji !== undefined && { emoji: body.emoji.trim() || null }),
      ...(body.highlightColor !== undefined && { highlightColor: body.highlightColor }),
      ...(body.highlightStyle !== undefined && { highlightStyle: body.highlightStyle }),
      ...(body.startAt !== undefined && { startAt }),
      ...(body.endAt !== undefined && { endAt }),
      ...(body.isAllDay !== undefined && { isAllDay: body.isAllDay }),
      ...(body.location !== undefined && { location: body.location.trim() || null }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.recurrenceRule !== undefined && { recurrenceRule: body.recurrenceRule.trim() || null }),
      ...(body.recurrenceEnd !== undefined && {
        recurrenceEnd: body.recurrenceEnd ? new Date(body.recurrenceEnd) : null,
      }),
    },
  });

  return toEventDTO(updated);
}

export async function softDeleteEvent(userId: string, eventId: string): Promise<void> {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, userId, deletedAt: null },
  });

  if (!existing) throw new AppError(404, "Event not found");

  await prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
  });
}
