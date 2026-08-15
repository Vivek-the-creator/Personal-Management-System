import winston from "winston";
import { config } from "../config/env";

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack }) =>
    stack
      ? `[${ts}] ${level}: ${message}\n${stack}`
      : `[${ts}] ${level}: ${message}`
  )
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: config.isDev ? "debug" : "info",
  format: config.isDev ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
  silent: config.env === "test",
});
