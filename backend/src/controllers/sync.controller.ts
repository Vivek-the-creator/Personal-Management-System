import type { Request, Response, NextFunction } from "express";
import * as syncService from "../services/sync.service";

export async function pushSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const userId = req.user.sub;
    const { operations } = req.body;

    if (!Array.isArray(operations)) {
      res.status(400).json({ success: false, message: "operations must be an array" });
      return;
    }

    const results = await syncService.processPush(userId, operations);

    res.json({
      success: true,
      message: "Push processed",
      data: { results },
    });
  } catch (err) {
    next(err);
  }
}

export async function pullSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const userId = req.user.sub;
    const { cursor, limit } = req.body;

    const data = await syncService.processPull(
      userId,
      cursor || null,
      typeof limit === "number" ? limit : 200
    );

    res.json({
      success: true,
      message: "Pull processed",
      data,
    });
  } catch (err) {
    next(err);
  }
}
