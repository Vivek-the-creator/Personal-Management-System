import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Plus, Settings2 } from "lucide-react";
import { CalendarBadge } from "@/components/calendar-workspace/CalendarBadge";
import { getCalendarColor } from "@/components/calendar-workspace/calendar-style";
import { CalendarManager } from "@/components/calendar-workspace/CalendarManager";
import { CalendarWorkspaceDialog } from "@/components/calendar-workspace/CalendarWorkspaceDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCalendarWorkspaces, useMediaQuery } from "@/hooks";
import { cn } from "@/lib/utils";

export function CalendarSwitcher() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const workspace = useCalendarWorkspaces();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const selected = workspace.selectedCalendar;

  if (workspace.isLoading) {
    return (
      <div className="hidden h-9 w-28 animate-pulse rounded-lg bg-muted sm:block" aria-hidden="true" />
    );
  }

  if (!selected) {
    return (
      <Button variant="outline" size="sm" onClick={() => setManagerOpen(true)}>
        <Plus className="h-4 w-4" />
        Calendar
      </Button>
    );
  }

  if (isDesktop) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 max-w-56 justify-start gap-2 rounded-lg px-2.5"
              aria-label="Select calendar"
            >
              <CalendarBadge calendar={selected} compact />
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 rounded-lg p-2">
            <DropdownMenuLabel>Active Calendars</DropdownMenuLabel>
            {workspace.visibleCalendars.map((calendar) => (
              <DropdownMenuItem
                key={calendar.id}
                onClick={() => workspace.setSelectedCalendarId(calendar.id)}
                className="rounded-md p-2"
              >
                <CalendarBadge calendar={calendar} selected={selected.id === calendar.id} />
              </DropdownMenuItem>
            ))}
            {workspace.visibleCalendars.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">No visible calendars.</p>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setManagerOpen(true)} className="rounded-md">
              <Settings2 className="h-4 w-4" />
              Manage Calendars
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CalendarWorkspaceDialog
          open={managerOpen}
          title="Calendar Workspace"
          onClose={() => setManagerOpen(false)}
        >
          <CalendarManager />
        </CalendarWorkspaceDialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMobileOpen(true)}
        className="flex max-w-[10rem] items-center gap-1.5 rounded-full px-2.5 py-1"
        aria-label="Open calendar selector"
      >
        <span className="text-sm">{selected.emoji}</span>
        <span className="truncate text-xs font-medium">{selected.name}</span>
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: getCalendarColor(selected.color).swatch }}
          aria-hidden="true"
        />
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </Button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Calendar selector"
          >
            <button className="absolute inset-0" type="button" onClick={() => setMobileOpen(false)} aria-label="Close" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-auto rounded-t-2xl border border-border/60 bg-card p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Calendar</h2>
                  <p className="text-sm text-muted-foreground">Choose a workspace</p>
                </div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid gap-2">
                {workspace.visibleCalendars.map((calendar) => (
                  <button
                    key={calendar.id}
                    type="button"
                    onClick={() => {
                      workspace.setSelectedCalendarId(calendar.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "rounded-lg border border-border/60 bg-background/50 p-3 text-left transition hover:bg-accent",
                      selected.id === calendar.id && "border-primary/50 bg-primary/8"
                    )}
                  >
                    <CalendarBadge calendar={calendar} selected={selected.id === calendar.id} />
                  </button>
                ))}
              </div>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => {
                  setMobileOpen(false);
                  setManagerOpen(true);
                }}
              >
                <Settings2 className="h-4 w-4" />
                Manage Calendars
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CalendarWorkspaceDialog
        open={managerOpen}
        title="Calendar Workspace"
        onClose={() => setManagerOpen(false)}
      >
        <CalendarManager compact />
      </CalendarWorkspaceDialog>
    </>
  );
}
