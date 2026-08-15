import { type Note } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import type {
  CreateNoteBody,
  NoteDTO,
  NoteFilterParams,
  UpdateNoteBody,
} from "../types/api.types";

function toNoteDTO(note: Note): NoteDTO {
  return {
    id: note.id,
    ...(note.calendarId && { calendarId: note.calendarId }),
    ...(note.title && { title: note.title }),
    content: note.content,
    date: note.date.toISOString(),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function listNotes(
  userId: string,
  params: NoteFilterParams
): Promise<NoteDTO[]> {
  const { calendarId, date, startDate, endDate, includeDeleted } = params;

  const where: any = {
    userId,
    ...(includeDeleted ? {} : { deletedAt: null }),
  };

  if (calendarId) {
    where.calendarId = calendarId;
  }

  if (date) {
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    where.date = {
      gte: dayStart,
      lte: dayEnd,
    };
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return notes.map(toNoteDTO);
}

export async function getNoteById(userId: string, noteId: string): Promise<NoteDTO> {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId, deletedAt: null },
  });

  if (!note) throw new AppError(404, "Note not found");
  return toNoteDTO(note);
}

export async function createNote(
  userId: string,
  body: CreateNoteBody
): Promise<NoteDTO> {
  if (!body.content || !body.content.trim()) {
    throw new AppError(400, "Content is required");
  }

  const noteDate = new Date(body.date);
  if (isNaN(noteDate.getTime())) {
    throw new AppError(400, "Invalid note date format");
  }

  const note = await prisma.note.create({
    data: {
      userId,
      calendarId: body.calendarId || null,
      title: body.title?.trim() || null,
      content: body.content,
      date: noteDate,
    },
  });

  return toNoteDTO(note);
}

export async function updateNote(
  userId: string,
  noteId: string,
  body: UpdateNoteBody
): Promise<NoteDTO> {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId, deletedAt: null },
  });

  if (!existing) throw new AppError(404, "Note not found");

  const noteDate = body.date ? new Date(body.date) : existing.date;
  if (isNaN(noteDate.getTime())) {
    throw new AppError(400, "Invalid note date format");
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(body.calendarId !== undefined && { calendarId: body.calendarId || null }),
      ...(body.title !== undefined && { title: body.title.trim() || null }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.date !== undefined && { date: noteDate }),
    },
  });

  return toNoteDTO(updated);
}

export async function softDeleteNote(userId: string, noteId: string): Promise<void> {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId, deletedAt: null },
  });

  if (!existing) throw new AppError(404, "Note not found");

  await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  });
}
