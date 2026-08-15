import { PrismaClient } from "@prisma/client";
import { config } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client (Prisma 6.x).
 *
 * In development, tsx hot-reload creates new module instances on every file
 * change. Without this global singleton pattern, each reload would spawn a new
 * connection pool, exhausting PostgreSQL's max_connections limit.
 *
 * In production, module-level caching provides the same singleton behaviour
 * without the global.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: config.isDev ? ["warn", "error"] : ["warn", "error"],
  });
}

export const prisma: PrismaClient = global.__prisma ?? createPrismaClient();

if (config.isDev) {
  global.__prisma = prisma;
}
