import { AnimatePresence, motion } from "framer-motion";
import { Calculator, CalendarDays, ChevronLeft, ChevronRight, GitBranch, LogOut, Search, Settings, Sparkles, User } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
import { useSearchModalStore, useUserStore } from "@/store";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppHeader() {
  const location = useLocation();
  const isTimelinePage = location.pathname.startsWith("/timeline");
  const isFestivalsPage = location.pathname.startsWith("/festivals");
  const isToolsPage = location.pathname.startsWith("/tools");
  const isSearchPage = location.pathname.startsWith("/search");
  const user = useUserStore((state) => state.user);
  const openSearch = useSearchModalStore((state) => state.openSearch);
  const { logout } = useAuth();
  const { monthTitle, direction, goToPreviousMonth, goToNextMonth, goToToday } =
    useCalendarEngine();
  const initials = user ? getInitials(user.name || user.email) : "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[96rem] items-center gap-2 px-3 sm:px-4 lg:px-5">
        <AppLogo compact className="shrink-0" />

        <div className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </NavLink>
          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <GitBranch className="h-3.5 w-3.5" />
            Timeline
          </NavLink>
          <NavLink
            to="/festivals"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            Festivals
          </NavLink>
          <NavLink
            to="/tools"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Calculator className="h-3.5 w-3.5" />
            Tools
          </NavLink>
        </nav>

        <div className="hidden h-5 w-px bg-border md:block" aria-hidden="true" />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!isTimelinePage && !isFestivalsPage && !isToolsPage ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground sm:text-lg">Timeline</h1>
              <CalendarSwitcher />
            </div>
          )}
        </div>

        {!isTimelinePage && !isSearchPage && (
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
        )}

        <button
          type="button"
          onClick={openSearch}
          aria-label="Open global search (Ctrl+K)"
          className="relative hidden h-9 w-44 items-center gap-2 rounded-lg border border-border/60 bg-muted/45 px-3 text-sm text-muted-foreground transition hover:border-border hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex lg:w-56"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Ctrl K
          </kbd>
        </button>

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
