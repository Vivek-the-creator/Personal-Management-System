import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/constants";

interface AppLogoProps {
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AppLogo({ compact = false, size = "md", className }: AppLogoProps) {
  const iconSizes = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-12 w-12" };
  const iconInnerSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
  const textSizes = {
    sm: { name: "text-xs font-semibold", tag: "text-[10px]" },
    md: { name: "text-sm font-semibold", tag: "text-xs" },
    lg: { name: "text-base font-bold", tag: "text-sm" },
  };

  return (
    <Link
      to={ROUTES.CALENDAR}
      className={cn("inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      aria-label={`${APP_NAME} home`}
    >
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm",
          iconSizes[size]
        )}
      >
        <CalendarDays className={iconInnerSizes[size]} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={cn("block tracking-tight text-foreground", textSizes[size].name)}>
            {APP_NAME}
          </span>
          <span className={cn("block text-muted-foreground", textSizes[size].tag)}>
            Life calendar
          </span>
        </span>
      )}
    </Link>
  );
}
