import { Request, Response, NextFunction } from "express";
import * as calendarService from "../services/calendar.service";
import { createResponse } from "../utils/response";

export async function listCalendars(req: Request, res: Response, next: NextFunction) {
  try {
    const calendars = await calendarService.listCalendars(req.user!.sub);
    res.status(200).json(createResponse(true, "Calendars retrieved", calendars));
  } catch (err) {
    next(err);
  }
}

export async function createCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const calendar = await calendarService.createCalendar(req.user!.sub, req.body);
    res.status(201).json(createResponse(true, "Calendar created", calendar));
  } catch (err) {
    next(err);
  }
}

export async function updateCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const calendar = await calendarService.updateCalendar(req.user!.sub, req.params.id, req.body);
    res.status(200).json(createResponse(true, "Calendar updated", calendar));
  } catch (err) {
    next(err);
  }
}

export async function deleteCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    await calendarService.deleteCalendar(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Calendar deleted"));
  } catch (err) {
    next(err);
  }
}

export async function archiveCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const calendar = await calendarService.archiveCalendar(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Calendar archived", calendar));
  } catch (err) {
    next(err);
  }
}

export async function restoreCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const calendar = await calendarService.restoreCalendar(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Calendar restored", calendar));
  } catch (err) {
    next(err);
  }
}

export async function setDefaultCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const calendar = await calendarService.setDefaultCalendar(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Default calendar updated", calendar));
  } catch (err) {
    next(err);
  }
}

export async function duplicateCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const calendar = await calendarService.duplicateCalendar(req.user!.sub, req.params.id);
    res.status(201).json(createResponse(true, "Calendar duplicated", calendar));
  } catch (err) {
    next(err);
  }
}
