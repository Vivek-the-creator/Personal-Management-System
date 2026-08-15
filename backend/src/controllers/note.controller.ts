import { Request, Response, NextFunction } from "express";
import * as noteService from "../services/note.service";
import { createResponse } from "../utils/response";

export async function listNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const { calendarId, date, startDate, endDate, includeDeleted } = req.query;
    const notes = await noteService.listNotes(req.user!.sub, {
      calendarId: calendarId as string | undefined,
      date: date as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      includeDeleted: includeDeleted === "true",
    });
    res.status(200).json(createResponse(true, "Notes retrieved", notes));
  } catch (err) {
    next(err);
  }
}

export async function getNoteById(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await noteService.getNoteById(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Note retrieved", note));
  } catch (err) {
    next(err);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await noteService.createNote(req.user!.sub, req.body);
    res.status(201).json(createResponse(true, "Note created", note));
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await noteService.updateNote(req.user!.sub, req.params.id, req.body);
    res.status(200).json(createResponse(true, "Note updated", note));
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    await noteService.softDeleteNote(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Note deleted"));
  } catch (err) {
    next(err);
  }
}
