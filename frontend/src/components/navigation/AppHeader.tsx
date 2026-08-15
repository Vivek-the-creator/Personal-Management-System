import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut, Search, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { CalendarSwitcher } from "@/components/calendar-workspace/CalendarSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useCalendarEngine } from "@/hooks";
import { useUserStore } from "@/store";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppHeader() {
  const user = useUserStore((state) => state.user);
  const { logout } = useAuth();
  const { monthTitle, direction, goToPreviousMonth, goToNextMonth, goToToday } =
    useCalendarEngine();
  const initials = user ? getInitials(user.name || user.email) : "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[96rem] items-center gap-2 px-3 sm:px-4 lg:px-5">
        <AppLogo compact className="shrink-0" />

        <div className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.h1
                key={monthTitle}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ y: dir > 0 ? 8 : -8, opacity: 0 }),
                  center: { y: 0, opacity: 1 },
                  exit: (dir: number) => ({ y: dir > 0 ? -8 : 8, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="truncate text-base font-semibold text-foreground sm:text-lg"
              >
                {monthTitle}
              </motion.h1>
            </AnimatePresence>
          </div>
          <CalendarSwitcher />
        </div>

        <nav className="flex items-center gap-1" aria-label="Calendar navigation">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            aria-label="Next month"
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            aria-label="Jump to today"
            className="hidden rounded-lg sm:inline-flex"
          >
            Today
          </Button>
        </nav>

        <label className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search placeholder"
            placeholder="Search"
            readOnly
            className="h-9 w-40 rounded-lg border border-border/60 bg-muted/45 pl-9 pr-3 text-sm text-muted-foreground outline-none transition focus:ring-2 focus:ring-ring lg:w-56"
          />
        </label>

        <ThemeSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="User menu"
            >
              <Avatar className="h-9 w-9">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem asChild>
              <Link to="/settings/account" className="flex cursor-pointer items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex cursor-pointer items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
