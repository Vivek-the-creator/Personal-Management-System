import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt";
import { AppError } from "./error.middleware";

// Augment Express Request to carry typed user
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Extracts and verifies the Bearer access token from the Authorization header.
 * On success, attaches `req.user` (AccessTokenPayload).
 * On failure, throws a 401 AppError which the global error handler converts to a clean response.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "No authorization token provided"));
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token"));
  }
}
