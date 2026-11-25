import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineJumpBarProps {
  yearsWithData: number[];
  visibleYearStart: number;
  visibleYearEnd: number;
  onJumpToYear: (year: number) => void;
  onLoadEarlier: () => void;
  onLoadLater: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}

export function TimelineJumpBar({
  yearsWithData,
  visibleYearStart,
  visibleYearEnd,
  onJumpToYear,
  onLoadEarlier,
  onLoadLater,
  onPrevYear,
  onNextYear,
}: TimelineJumpBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
      {/* Earlier Years Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onLoadEarlier}
        className="h-8 gap-1 rounded-xl text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronUp className="h-3.5 w-3.5" />
        Load earlier history ({visibleYearStart - 2}–{visibleYearStart - 1})
      </Button>

      {/* Quick Year Navigation Pills */}
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevYear}
          aria-label="Previous Year"
          className="h-7 w-7 rounded-lg"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {yearsWithData.map((yr) => {
          const isVisible = yr >= visibleYearStart && yr <= visibleYearEnd;
          return (
            <button
              key={yr}
              type="button"
              onClick={() => onJumpToYear(yr)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isVisible
                  ? "bg-primary/10 text-primary font-bold hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {yr}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          onClick={onNextYear}
          aria-label="Next Year"
          className="h-7 w-7 rounded-lg"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Later Years Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onLoadLater}
        className="h-8 gap-1 rounded-xl text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className="h-3.5 w-3.5" />
        Load future plans ({visibleYearEnd + 1}–{visibleYearEnd + 2})
      </Button>
    </div>
  );
}
