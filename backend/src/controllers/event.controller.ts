import { Request, Response, NextFunction } from "express";
import * as eventService from "../services/event.service";
import { createResponse } from "../utils/response";

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { calendarId, startDate, endDate, includeDeleted } = req.query;
    const events = await eventService.listEvents(req.user!.sub, {
      calendarId: calendarId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      includeDeleted: includeDeleted === "true",
    });
    res.status(200).json(createResponse(true, "Events retrieved", events));
  } catch (err) {
    next(err);
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventService.getEventById(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Event retrieved", event));
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventService.createEvent(req.user!.sub, req.body);
    res.status(201).json(createResponse(true, "Event created", event));
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventService.updateEvent(req.user!.sub, req.params.id, req.body);
    res.status(200).json(createResponse(true, "Event updated", event));
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    await eventService.softDeleteEvent(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Event deleted"));
  } catch (err) {
    next(err);
  }
}
