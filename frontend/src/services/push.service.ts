import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface PushStatus {
  hasSubscription: boolean;
  vapidPublicKey: string;
  subscriptionCount: number;
}

export async function getPushStatus(): Promise<PushStatus> {
  const res = await apiClient.get<ApiResponse<PushStatus>>("/push/status");
  return (
    res.data ?? {
      hasSubscription: false,
      vapidPublicKey: "",
      subscriptionCount: 0,
    }
  );
}

export async function subscribePush(subscription: PushSubscriptionJSON): Promise<void> {
  await apiClient.post("/push/subscribe", {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await apiClient.delete("/push/subscribe", { endpoint });
}

export async function sendTestPush(): Promise<void> {
  await apiClient.post("/push/test");
}
