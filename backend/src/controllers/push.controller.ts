import { Request, Response, NextFunction } from "express";
import * as pushService from "../services/push.service";
import { createResponse } from "../utils/response";

export async function getPushStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await pushService.getPushStatus(req.user!.sub);
    res.status(200).json(createResponse(true, "Push status retrieved", status));
  } catch (err) {
    next(err);
  }
}

export async function subscribePush(req: Request, res: Response, next: NextFunction) {
  try {
    await pushService.savePushSubscription(req.user!.sub, req.body);
    res.status(200).json(createResponse(true, "Push subscription saved"));
  } catch (err) {
    next(err);
  }
}

export async function unsubscribePush(req: Request, res: Response, next: NextFunction) {
  try {
    const { endpoint } = req.body;
    await pushService.deletePushSubscription(req.user!.sub, endpoint);
    res.status(200).json(createResponse(true, "Push subscription removed"));
  } catch (err) {
    next(err);
  }
}

export async function sendTestPush(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pushService.sendPushNotificationToUser(req.user!.sub, {
      title: "Doodo 🔔 Test Notification",
      body: "Web Push notifications are working perfectly!",
      data: { url: "/" },
    });
    res.status(200).json(createResponse(true, "Test push dispatched", result));
  } catch (err) {
    next(err);
  }
}
