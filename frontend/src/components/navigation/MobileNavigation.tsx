import { NavLink } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BOTTOM_NAV_ITEMS } from "@/constants";
import { cn } from "@/lib/utils";
import { navIcons } from "./nav-icons";

export function BottomNavigation() {
  return (
    <TooltipProvider delayDuration={150}>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Bottom navigation"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = navIcons[item.icon];

            if (item.label === "Add") {
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="mx-auto my-auto grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Add, coming soon"
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Coming Soon</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <NavLink
                key={item.href}
                to={item.href}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    "mx-auto my-auto grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive && "bg-accent text-primary"
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </NavLink>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}
