import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import type { UserDTO, SettingsDTO, UpdateSettingsBody } from "../types/api.types";

export async function getUserById(userId: string): Promise<UserDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getSettings(userId: string): Promise<SettingsDTO> {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return {
    theme: settings.theme,
    language: settings.language,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    weekStartsOn: settings.weekStartsOn,
    notificationsEnabled: settings.notificationsEnabled,
  };
}

export async function updateSettings(
  userId: string,
  partial: UpdateSettingsBody
): Promise<SettingsDTO> {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: partial,
    create: { userId, ...partial },
  });

  return {
    theme: settings.theme,
    language: settings.language,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    weekStartsOn: settings.weekStartsOn,
    notificationsEnabled: settings.notificationsEnabled,
  };
}
