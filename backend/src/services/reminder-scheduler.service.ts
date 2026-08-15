import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";
import { sendPushNotificationToUser } from "./push.service";

let schedulerTimer: NodeJS.Timeout | null = null;
const CHECK_INTERVAL_MS = 30_000; // 30 seconds
const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes grace period

export function startReminderScheduler() {
  if (schedulerTimer) return;

  logger.info("[Scheduler] Starting background reminder scheduler (30s interval)...");
  schedulerTimer = setInterval(processPendingReminders, CHECK_INTERVAL_MS);

  // Run initial check immediately on boot
  processPendingReminders().catch((err) => {
    logger.error("[Scheduler] Error in initial reminder processing:", err);
  });
}

export function stopReminderScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    logger.info("[Scheduler] Stopped background reminder scheduler.");
  }
}

async function processPendingReminders() {
  const now = new Date();
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_MS);

  try {
    // 1. Mark expired reminders (older than 15 minutes grace period)
    const expiredCount = await prisma.reminder.updateMany({
      where: {
        status: "PENDING",
        enabled: true,
        scheduledAt: { lt: graceCutoff },
      },
      data: { status: "EXPIRED" },
    });

    if (expiredCount.count > 0) {
      logger.info(`[Scheduler] Marked ${expiredCount.count} overdue reminders as EXPIRED.`);
    }

    // 2. Fetch due pending reminders
    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: "PENDING",
        enabled: true,
        scheduledAt: { lte: now, gte: graceCutoff },
      },
      include: {
        event: true,
      },
      take: 50,
    });

    if (dueReminders.length === 0) return;

    logger.info(`[Scheduler] Found ${dueReminders.length} due reminders to process.`);

    for (const reminder of dueReminders) {
      // Atomic locking: update status to PROCESSING to prevent duplicate execution
      const claim = await prisma.reminder.updateMany({
        where: { id: reminder.id, status: "PENDING" },
        data: { status: "PROCESSING" },
      });

      if (claim.count === 0) continue; // Already claimed by another worker tick

      const event = reminder.event;
      if (!event || event.deletedAt) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "CANCELLED" },
        });
        continue;
      }

      // Format Push Payload
      const notificationTitle = `Doodo ${event.emoji || "🔔"}`;
      const notificationBody = `${event.title} - ${event.isAllDay ? "Today" : "Scheduled Event"}`;
      const payloadData = {
        eventId: event.id,
        dateKey: event.startAt.toISOString().split("T")[0],
        url: `/?date=${event.startAt.toISOString().split("T")[0]}&eventId=${event.id}`,
      };

      try {
        const result = await sendPushNotificationToUser(reminder.userId, {
          title: notificationTitle,
          body: notificationBody,
          data: payloadData,
        });

        // If no subscriptions exist at all, log a warning — the user has not subscribed to push
        if (result.sent === 0 && result.failed === 0) {
          logger.warn(
            `[Scheduler] Reminder ${reminder.id}: no push subscriptions found for user ${reminder.userId}. ` +
            `Reverting to PENDING so it retries when the user subscribes.`
          );
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: "PENDING" },
          });
          continue;
        }

        const newStatus = result.sent > 0 ? "SENT" : "FAILED";

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: newStatus,
            sentAt: new Date(),
          },
        });
      } catch (dispatchErr) {
        logger.error(`[Scheduler] Failed to dispatch reminder ${reminder.id}:`, dispatchErr);
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED" },
        });
      }
    }
  } catch (err) {
    logger.error("[Scheduler] Error in processPendingReminders loop:", err);
  }
}
