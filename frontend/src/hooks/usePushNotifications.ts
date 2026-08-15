import { useEffect, useState } from "react";
import { getPushStatus, sendTestPush, subscribePush } from "@/services/push.service";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidKey, setVapidKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Load Push Status & VAPID Key
    getPushStatus()
      .then((status) => {
        setVapidKey(status.vapidPublicKey);
        setIsSubscribed(status.hasSubscription);
      })
      .catch(() => {});
  }, []);

  async function requestPermissionAndSubscribe(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return false;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setIsLoading(false);
        return false;
      }

      // Register / get SW registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID Key
      let key = vapidKey;
      if (!key) {
        const status = await getPushStatus();
        key = status.vapidPublicKey;
        setVapidKey(key);
      }

      if (!key) {
        setIsLoading(false);
        return true;
      }

      // Always unsubscribe the old browser subscription first.
      // This is critical when the VAPID key has changed on the server — the old subscription
      // is silently invalid and will never deliver notifications.
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Create a fresh subscription bound to the current VAPID key
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      await subscribePush(sub.toJSON());
      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function triggerTestNotification() {
    await sendTestPush();
  }

  return {
    permission,
    isSubscribed,
    isLoading,
    vapidKey,
    requestPermissionAndSubscribe,
    triggerTestNotification,
  };
}
