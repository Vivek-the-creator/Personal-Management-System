import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { createResponse } from "../utils/response";
import { logger } from "../utils/logger";
import type { LoginBody, RegisterBody } from "../types/api.types";

const REFRESH_COOKIE = "pms_refresh_token";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { auth, refreshToken } = await authService.registerUser(req.body as RegisterBody);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

    logger.info(`New user registered: ${auth.user.email}`);
    res.status(201).json(createResponse(true, "Registration successful", auth));
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { auth, refreshToken } = await authService.loginUser(req.body as LoginBody);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

    logger.info(`User logged in: ${auth.user.email}`);
    res.status(200).json(createResponse(true, "Login successful", auth));
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json(createResponse(false, "No refresh token"));
      return;
    }

    const tokens = await authService.refreshTokens(token);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
    res.status(200).json(createResponse(true, "Token refreshed", { accessToken: tokens.accessToken }));
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) await authService.logout(token);

    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: 0 });
    res.status(200).json(createResponse(true, "Logged out successfully"));
  } catch (err) {
    next(err);
  }
}
