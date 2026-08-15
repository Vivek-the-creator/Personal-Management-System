import { Prisma, type Calendar } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import type { CalendarDTO, CreateCalendarBody, UpdateCalendarBody } from "../types/api.types";

function toCalendarDTO(calendar: Calendar): CalendarDTO {
  return {
    id: calendar.id,
    name: calendar.name,
    emoji: calendar.emoji,
    color: calendar.color,
    ...(calendar.description && { description: calendar.description }),
    isDefault: calendar.isDefault,
    isVisible: calendar.isVisible,
    isArchived: calendar.isArchived,
    createdAt: calendar.createdAt.toISOString(),
    updatedAt: calendar.updatedAt.toISOString(),
  };
}

function normalizeDescription(description?: string): string | null | undefined {
  if (description === undefined) return undefined;
  const trimmed = description.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function assertCalendarNameAvailable(
  userId: string,
  name: string,
  ignoreCalendarId?: string
): Promise<void> {
  const existing = await prisma.calendar.findFirst({
    where: {
      userId,
      name,
      ...(ignoreCalendarId ? { id: { not: ignoreCalendarId } } : {}),
    },
  });

  if (existing) throw new AppError(409, "A calendar with this name already exists");
}

async function getOwnedCalendar(userId: string, calendarId: string): Promise<Calendar> {
  const calendar = await prisma.calendar.findFirst({
    where: { id: calendarId, userId },
  });
  if (!calendar) throw new AppError(404, "Calendar not found");
  return calendar;
}

async function ensureAnotherActiveCalendar(userId: string, calendarId: string): Promise<void> {
  const count = await prisma.calendar.count({
    where: {
      userId,
      id: { not: calendarId },
      isArchived: false,
    },
  });

  if (count === 0) throw new AppError(409, "You must keep at least one active calendar");
}

async function clearDefaultCalendars(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.calendar.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
}

export async function listCalendars(userId: string): Promise<CalendarDTO[]> {
  const calendars = await prisma.calendar.findMany({
    where: { userId },
    orderBy: [{ isArchived: "asc" }, { isDefault: "desc" }, { updatedAt: "desc" }],
  });

  if (calendars.length === 0) {
    const calendar = await createCalendar(userId, {
      name: "My Calendar",
      emoji: "⭐",
      color: "sky",
      isDefault: true,
    });
    return [calendar];
  }

  return calendars.map(toCalendarDTO);
}

export async function createCalendar(
  userId: string,
  body: CreateCalendarBody
): Promise<CalendarDTO> {
  await assertCalendarNameAvailable(userId, body.name);

  const activeCount = await prisma.calendar.count({ where: { userId, isArchived: false } });
  const shouldBeDefault = body.isDefault === true || activeCount === 0;

  const calendar = await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) await clearDefaultCalendars(tx, userId);
    return tx.calendar.create({
      data: {
        userId,
        name: body.name,
        emoji: body.emoji,
        color: body.color,
        description: normalizeDescription(body.description),
        isDefault: shouldBeDefault,
      },
    });
  });

  return toCalendarDTO(calendar);
}

export async function updateCalendar(
  userId: string,
  calendarId: string,
  body: UpdateCalendarBody
): Promise<CalendarDTO> {
  const calendar = await getOwnedCalendar(userId, calendarId);
  if (body.name && body.name !== calendar.name) {
    await assertCalendarNameAvailable(userId, body.name, calendarId);
  }

  if (body.isDefault === true && calendar.isArchived) {
    throw new AppError(409, "Archived calendars cannot be set as default");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (body.isDefault === true) await clearDefaultCalendars(tx, userId);

    return tx.calendar.update({
      where: { id: calendarId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.emoji !== undefined && { emoji: body.emoji }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.description !== undefined && {
          description: normalizeDescription(body.description),
        }),
        ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    });
  });

  return toCalendarDTO(updated);
}

export async function deleteCalendar(userId: string, calendarId: string): Promise<void> {
  const calendar = await getOwnedCalendar(userId, calendarId);
  if (!calendar.isArchived) await ensureAnotherActiveCalendar(userId, calendarId);
  if (calendar.isDefault) {
    throw new AppError(409, "Select another default calendar before deleting this one");
  }

  await prisma.calendar.delete({ where: { id: calendarId } });
}

export async function archiveCalendar(userId: string, calendarId: string): Promise<CalendarDTO> {
  const calendar = await getOwnedCalendar(userId, calendarId);
  await ensureAnotherActiveCalendar(userId, calendarId);
  if (calendar.isDefault) {
    throw new AppError(409, "Select another default calendar before archiving this one");
  }

  const archived = await prisma.calendar.update({
    where: { id: calendarId },
    data: { isArchived: true, isVisible: false },
  });

  return toCalendarDTO(archived);
}

export async function restoreCalendar(userId: string, calendarId: string): Promise<CalendarDTO> {
  await getOwnedCalendar(userId, calendarId);
  const restored = await prisma.calendar.update({
    where: { id: calendarId },
    data: { isArchived: false, isVisible: true },
  });

  return toCalendarDTO(restored);
}

export async function setDefaultCalendar(
  userId: string,
  calendarId: string
): Promise<CalendarDTO> {
  const calendar = await getOwnedCalendar(userId, calendarId);
  if (calendar.isArchived) throw new AppError(409, "Archived calendars cannot be default");

  const updated = await prisma.$transaction(async (tx) => {
    await clearDefaultCalendars(tx, userId);
    return tx.calendar.update({
      where: { id: calendarId },
      data: { isDefault: true, isVisible: true },
    });
  });

  return toCalendarDTO(updated);
}

export async function duplicateCalendar(userId: string, calendarId: string): Promise<CalendarDTO> {
  const calendar = await getOwnedCalendar(userId, calendarId);
  const baseName = `${calendar.name} Copy`.slice(0, 50);
  let name = baseName;
  let suffix = 2;

  while (await prisma.calendar.findFirst({ where: { userId, name } })) {
    const suffixText = ` ${suffix}`;
    name = `${baseName.slice(0, 50 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  const duplicated = await prisma.calendar.create({
    data: {
      userId,
      name,
      emoji: calendar.emoji,
      color: calendar.color,
      description: calendar.description,
      isDefault: false,
      isVisible: true,
      isArchived: false,
    },
  });

  return toCalendarDTO(duplicated);
}
