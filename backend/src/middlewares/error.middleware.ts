import { Request, Response, NextFunction } from "express";
import { createResponse } from "../utils/response";
import { logger } from "../utils/logger";

/**
 * Application-level error with HTTP status code.
 * Throw this anywhere in the request pipeline to produce a clean API response.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json(createResponse(false, `Route ${req.method} ${req.path} not found`));
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`[AppError] ${err.statusCode} – ${err.message}`);
    res
      .status(err.statusCode)
      .json(createResponse(false, err.message));
    return;
  }

  logger.error("[UnhandledError]", { message: err.message, stack: err.stack });
  res
    .status(500)
    .json(createResponse(false, "Internal server error"));
}
