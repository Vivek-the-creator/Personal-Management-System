import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { createResponse } from "../utils/response";

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.getUserById(req.user!.sub);
    res.status(200).json(createResponse(true, "User retrieved", user));
  } catch (err) {
    next(err);
  }
}

export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await userService.getSettings(req.user!.sub);
    res.status(200).json(createResponse(true, "Settings retrieved", settings));
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await userService.updateSettings(req.user!.sub, req.body);
    res.status(200).json(createResponse(true, "Settings updated", settings));
  } catch (err) {
    next(err);
  }
}
