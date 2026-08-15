import jwt from "jsonwebtoken";
import { config } from "../config/env";

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  jti: string; // unique token id (matches RefreshToken.id in DB)
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.secret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}

/** Parse refresh token expiry string into a Date */
export function getRefreshTokenExpiry(): Date {
  const raw = config.jwt.refreshExpiresIn; // e.g. "7d"
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN format: ${raw}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

  return new Date(Date.now() + value * ms[unit]);
}
