import app from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { startReminderScheduler } from "./services/reminder-scheduler.service";

const server = app.listen(config.port, () => {
  logger.info(`Server running in ${config.env} mode`);
  logger.info(`Listening on http://localhost:${config.port}`);
  logger.info(`API available at http://localhost:${config.port}/api/v1`);
  startReminderScheduler();
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => process.exit(0));
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection", { reason });
  server.close(() => process.exit(1));
});
