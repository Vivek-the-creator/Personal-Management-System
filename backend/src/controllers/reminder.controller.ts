import { Request, Response, NextFunction } from "express";
import * as reminderService from "../services/reminder.service";
import { createResponse } from "../utils/response";

export async function listReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventId } = req.query;
    const reminders = await reminderService.listReminders(req.user!.sub, eventId as string | undefined);
    res.status(200).json(createResponse(true, "Reminders retrieved", reminders));
  } catch (err) {
    next(err);
  }
}

export async function createReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const reminder = await reminderService.createReminder(req.user!.sub, req.body);
    res.status(201).json(createResponse(true, "Reminder created", reminder));
  } catch (err) {
    next(err);
  }
}

export async function updateReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const reminder = await reminderService.updateReminder(req.user!.sub, req.params.id, req.body);
    res.status(200).json(createResponse(true, "Reminder updated", reminder));
  } catch (err) {
    next(err);
  }
}

export async function deleteReminder(req: Request, res: Response, next: NextFunction) {
  try {
    await reminderService.deleteReminder(req.user!.sub, req.params.id);
    res.status(200).json(createResponse(true, "Reminder deleted"));
  } catch (err) {
    next(err);
  }
}
