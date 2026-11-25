import { CalendarDays, History, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface TimelineEmptyStateProps {
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

export function TimelineEmptyState({ onResetFilters, isFiltered }: TimelineEmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 sm:p-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <History className="h-7 w-7" />
      </div>

      <h3 className="text-lg font-bold text-foreground sm:text-xl">
        Nothing here yet.
      </h3>

      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        Your events and memories will appear here as you add them.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isFiltered && onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Clear Filters
          </Button>
        )}

        <Button size="sm" onClick={() => navigate("/calendar")} className="gap-1.5">
          <CalendarDays className="h-4 w-4" />
          Go to Calendar
        </Button>
      </div>
    </div>
  );
}
