import { motion } from "framer-motion";
import { Bell, CircleUserRound, Palette, ShieldCheck, Info, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  { title: "General", description: "Language, date format, and app defaults.", icon: ShieldCheck, href: "/settings/general" },
  { title: "Appearance", description: "Light, dark, and system theme controls.", icon: Palette, href: "/settings/appearance" },
  { title: "Festivals & Holidays", description: "Regional holidays, religious observances, and calendar visibility.", icon: Sparkles, href: "/settings/festivals" },
  { title: "Account", description: "Profile details and account preferences.", icon: CircleUserRound, href: "/settings/account" },
  { title: "Notifications", description: "Future reminder preferences and delivery settings.", icon: Bell, href: "/settings/notifications" },
  { title: "Sync & Data", description: "Offline sync status, manual sync, and offline audit logs.", icon: RefreshCw, href: "/settings/sync" },
  { title: "About", description: "Versioning, product details, and app information.", icon: Info, href: "/settings/about" },
];

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
          This section is prepared as the central hub for future preferences and account controls.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="border-border/80 bg-card/80">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={section.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
