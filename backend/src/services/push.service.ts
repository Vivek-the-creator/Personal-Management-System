import webPush from "web-push";
import { prisma } from "../config/prisma";
import { AppError } from "../middlewares/error.middleware";
import type { PushStatusDTO, PushSubscriptionBody } from "../types/api.types";

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

// Auto-generate VAPID keys if not present in environment
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  const generated = webPush.generateVAPIDKeys();
  vapidKeys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
  };
}

// Configure web-push details
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:support@doodo.app",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}

export async function getPushStatus(userId: string): Promise<PushStatusDTO> {
  const count = await prisma.pushSubscription.count({
    where: { userId },
  });

  return {
    hasSubscription: count > 0,
    vapidPublicKey: vapidKeys.publicKey,
    subscriptionCount: count,
  };
}

export async function savePushSubscription(
  userId: string,
  body: PushSubscriptionBody
): Promise<void> {
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    throw new AppError(400, "Invalid push subscription body");
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: {
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent || null,
    },
    update: {
      userId,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent || null,
    },
  });
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });
}

export async function sendPushNotificationToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: "/badge.png",
    data: payload.data || {},
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        notificationPayload
      );
      sent++;
    } catch (err: any) {
      failed++;
      // If subscription expired or invalid (410 Gone / 404 Not Found), clean it up from DB
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return { sent, failed };
}
