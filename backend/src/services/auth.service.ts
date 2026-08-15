import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/jwt";
import { logger } from "../utils/logger";
import type { AuthResponseDTO, UserDTO, SettingsDTO, RegisterBody, LoginBody } from "../types/api.types";

/** Map Prisma user + settings to safe DTOs */
function toUserDTO(user: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date }): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
    createdAt: user.createdAt.toISOString(),
  };
}

function toSettingsDTO(settings: {
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  notificationsEnabled: boolean;
}): SettingsDTO {
  return {
    theme: settings.theme,
    language: settings.language,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    weekStartsOn: settings.weekStartsOn,
    notificationsEnabled: settings.notificationsEnabled,
  };
}

async function issueAuthTokens(user: { id: string; email: string }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    jti: refreshTokenRecord.id,
  });

  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { token: refreshToken },
  });

  return { accessToken, refreshToken };
}

/**
 * Register a new user with name, email, and password.
 */
export async function registerUser(body: RegisterBody): Promise<{
  auth: AuthResponseDTO;
  refreshToken: string;
}> {
  const normalizedEmail = body.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: body.name.trim(),
      password: hashedPassword,
    },
  });

  // Ensure default calendar
  await prisma.calendar.create({
    data: {
      name: "My Calendar",
      emoji: "⭐",
      color: "sky",
      isDefault: true,
      userId: user.id,
    },
  });

  // Ensure user settings
  const settings = await prisma.userSettings.create({
    data: { userId: user.id },
  });

  const { accessToken, refreshToken } = await issueAuthTokens(user);

  return {
    auth: {
      accessToken,
      user: toUserDTO(user),
      settings: toSettingsDTO(settings),
    },
    refreshToken,
  };
}

/**
 * Authenticate existing user with email and password.
 */
export async function loginUser(body: LoginBody): Promise<{
  auth: AuthResponseDTO;
  refreshToken: string;
}> {
  const normalizedEmail = body.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.password) {
    throw new AppError(401, "Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(body.password, user.password);
  if (!isValidPassword) {
    throw new AppError(401, "Invalid email or password");
  }

  // Ensure settings exist
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const { accessToken, refreshToken } = await issueAuthTokens(user);

  return {
    auth: {
      accessToken,
      user: toUserDTO(user),
      settings: toSettingsDTO(settings),
    },
    refreshToken,
  };
}

/**
 * Rotate refresh token: verify → delete old → issue new pair.
 */
export async function refreshTokens(oldRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token expired or revoked");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const { accessToken, refreshToken: newRefreshToken } = await issueAuthTokens(stored.user);

  logger.debug(`Rotated refresh token for user ${payload.sub}`);
  return { accessToken, refreshToken: newRefreshToken };
}

/**
 * Invalidate a refresh token (logout).
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}
