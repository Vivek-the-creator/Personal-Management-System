import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Sparkles, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Calendar-first planning",
    description: "Organize your life around a calm, visual timeline built for focus.",
    icon: CalendarDays,
  },
  {
    title: "Offline-safe by design",
    description: "Capture plans and notes even when you are offline and sync later.",
    icon: ShieldCheck,
  },
  {
    title: "Designed for every screen",
    description: "A responsive experience that feels native on mobile and premium on desktop.",
    icon: Smartphone,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Offline-first personal planning platform
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              A calmer way to manage your life.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Chronicle brings calendars, notes, timelines, and daily planning into one refined workspace designed for modern life.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/register">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
            <div className="rounded-2xl border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-2xl font-semibold text-foreground">June 12</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Focus mode</div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Design review", time: "09:30" },
                  { label: "Write reflections", time: "13:00" },
                  { label: "Evening reset", time: "20:30" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-border/80 bg-card/70">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
