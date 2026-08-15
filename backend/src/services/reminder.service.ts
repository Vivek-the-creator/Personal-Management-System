import { type Reminder } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import type { CreateReminderBody, ReminderDTO, UpdateReminderBody } from "../types/api.types";

function toReminderDTO(r: Reminder): ReminderDTO {
  return {
    id: r.id,
    eventId: r.eventId,
    type: r.type,
    scheduledAt: r.scheduledAt.toISOString(),
    timezone: r.timezone,
    enabled: r.enabled,
    status: r.status,
    ...(r.sentAt && { sentAt: r.sentAt.toISOString() }),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listReminders(userId: string, eventId?: string): Promise<ReminderDTO[]> {
  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      ...(eventId ? { eventId } : {}),
    },
    orderBy: { scheduledAt: "asc" },
  });

  return reminders.map(toReminderDTO);
}

export async function createReminder(
  userId: string,
  body: CreateReminderBody
): Promise<ReminderDTO> {
  const event = await prisma.event.findFirst({
    where: { id: body.eventId, userId, deletedAt: null },
  });

  if (!event) throw new AppError(404, "Event not found");

  const scheduledAt = new Date(body.scheduledAt);
  if (isNaN(scheduledAt.getTime())) {
    throw new AppError(400, "Invalid scheduledAt date format");
  }

  // Get user's configured timezone or default to UTC
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const timezone = body.timezone || "UTC";

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      eventId: body.eventId,
      type: body.type || "start_of_day",
      scheduledAt,
      timezone,
      enabled: body.enabled ?? true,
      status: "PENDING",
    },
  });

  return toReminderDTO(reminder);
}

export async function updateReminder(
  userId: string,
  reminderId: string,
  body: UpdateReminderBody
): Promise<ReminderDTO> {
  const existing = await prisma.reminder.findFirst({
    where: { id: reminderId, userId },
  });

  if (!existing) throw new AppError(404, "Reminder not found");

  const data: any = {};
  if (body.type !== undefined) data.type = body.type;
  if (body.enabled !== undefined) data.enabled = body.enabled;
  if (body.timezone !== undefined) data.timezone = body.timezone;
  if (body.status !== undefined) data.status = body.status;
  if (body.scheduledAt !== undefined) {
    const scheduledAt = new Date(body.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new AppError(400, "Invalid scheduledAt date format");
    }
    data.scheduledAt = scheduledAt;
    // Reset status to PENDING if rescheduled
    data.status = "PENDING";
  }

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data,
  });

  return toReminderDTO(updated);
}

export async function deleteReminder(userId: string, reminderId: string): Promise<void> {
  const existing = await prisma.reminder.findFirst({
    where: { id: reminderId, userId },
  });

  if (!existing) throw new AppError(404, "Reminder not found");

  await prisma.reminder.delete({ where: { id: reminderId } });
}
