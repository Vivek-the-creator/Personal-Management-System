import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Info, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications, useSettings } from "@/hooks";
import { cn } from "@/lib/utils";

export function NotificationsSettingsPage() {
  const { settings, updateSettings } = useSettings();
  const push = usePushNotifications();

  const [defaultTime, setDefaultTime] = useState("06:00");
  const [testSent, setTestSent] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isResubscribing, setIsResubscribing] = useState(false);
  const [resubscribeStatus, setResubscribeStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleToggleNotifications(enabled: boolean) {
    await updateSettings({ notificationsEnabled: enabled });
    if (enabled) {
      await push.requestPermissionAndSubscribe();
    }
  }

  async function handleSendTest() {
    setIsSendingTest(true);
    try {
      await push.triggerTestNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    } finally {
      setIsSendingTest(false);
    }
  }

  async function handleResubscribe() {
    setIsResubscribing(true);
    setResubscribeStatus("idle");
    try {
      const ok = await push.requestPermissionAndSubscribe();
      setResubscribeStatus(ok ? "success" : "error");
      setTimeout(() => setResubscribeStatus("idle"), 4000);
    } finally {
      setIsResubscribing(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-border/80 bg-card/80 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notification Settings
          </CardTitle>
          <CardDescription>
            Configure Web Push notifications, default reminder times, and device subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {/* Main Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div>
              <Label className="text-sm font-semibold">Web Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive background event reminders even when Doodo is not open.
              </p>
            </div>
            <Switch
              checked={settings?.notificationsEnabled ?? true}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {/* Browser Permission Status Badge */}
          <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Browser Permission</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider",
                  push.permission === "granted" && "bg-green-500/15 text-green-600 dark:text-green-400",
                  push.permission === "denied" && "bg-destructive/15 text-destructive",
                  push.permission === "default" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  push.permission === "unsupported" && "bg-muted text-muted-foreground"
                )}
              >
                {push.permission}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Push Subscription</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider",
                  push.isSubscribed
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                {push.isSubscribed ? "Active" : "Not Subscribed"}
              </span>
            </div>

            {push.permission === "denied" && (
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Notifications are blocked. Please allow them in your browser's site settings, then re-subscribe below.</span>
              </div>
            )}

            {push.permission === "granted" && !push.isSubscribed && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>
                  Permission is granted but this device has no active push subscription.
                  Click <strong>Re-subscribe</strong> below to fix this.
                </span>
              </div>
            )}
          </div>

          {/* Re-subscribe / Fix Subscription */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/15 p-4">
            <div className="grid gap-0.5">
              <p className="text-xs font-semibold text-foreground">Re-subscribe to Push</p>
              <p className="text-[11px] text-muted-foreground">
                Fixes broken or stale subscriptions (e.g. after a VAPID key change or browser update).
                Always run this if "Send Test" doesn't deliver a notification.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResubscribe}
              disabled={isResubscribing || push.permission === "denied" || push.permission === "unsupported"}
              className="gap-1.5 shrink-0"
            >
              {resubscribeStatus === "success" ? (
                <><Check className="h-3.5 w-3.5 text-green-500" /> Done!</>
              ) : resubscribeStatus === "error" ? (
                <><ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Failed</>
              ) : (
                <><RefreshCw className={cn("h-3.5 w-3.5", isResubscribing && "animate-spin")} /> Re-subscribe</>
              )}
            </Button>
          </div>

          {/* Default Reminder Time */}
          <div className="grid gap-2 rounded-xl border border-border/60 p-4">
            <div className="grid gap-1">
              <Label htmlFor="default-time" className="text-xs font-semibold">
                Default Reminder Time (All-Day Events)
              </Label>
              <p className="text-xs text-muted-foreground">
                Default morning time for all-day reminders (Default: 6:00 AM).
              </p>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="default-time"
                type="time"
                value={defaultTime}
                onChange={(e) => setDefaultTime(e.target.value)}
                className="w-36 h-9 text-xs"
              />
              <span className="text-xs text-muted-foreground">Standard 6:00 AM start</span>
            </div>
          </div>

          {/* Test Notification Action */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/15 p-4">
            <div className="grid gap-0.5">
              <p className="text-xs font-semibold text-foreground">Test Push Notification</p>
              <p className="text-[11px] text-muted-foreground">
                Dispatch an instant test notification to verify background push is working.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendTest}
              disabled={isSendingTest || push.permission !== "granted" || !push.isSubscribed}
              className="gap-1.5"
            >
              {testSent ? (
                <><Check className="h-3.5 w-3.5 text-green-500" /> Sent!</>
              ) : (
                <><Send className="h-3.5 w-3.5" /> Send Test</>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 text-primary" />
            <span>Timezone-aware scheduling uses your configured system timezone (UTC).</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
