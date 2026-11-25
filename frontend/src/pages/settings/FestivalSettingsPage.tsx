import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app.constants";
import { useDocumentTitle, useFestivalSettings } from "@/hooks";
import type { FestivalRegion, FestivalSettings } from "@/types/festival.types";
import { DEFAULT_FESTIVAL_SETTINGS, FESTIVAL_REGION_LABELS } from "@/utils/festival.utils";

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ id, label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/70 p-3.5 transition ${
        disabled ? "cursor-not-allowed opacity-55" : "hover:border-primary/40"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-primary"
      />
    </label>
  );
}

const REGION_OPTIONS: Array<{ value: FestivalRegion | "all"; label: string }> = [
  { value: "tamil-nadu", label: FESTIVAL_REGION_LABELS["tamil-nadu"] },
  { value: "india", label: FESTIVAL_REGION_LABELS.india },
  { value: "kerala", label: FESTIVAL_REGION_LABELS.kerala },
  { value: "all", label: "All Regions" },
];

export function FestivalSettingsPage() {
  useDocumentTitle("Festival Settings · Doodo");
  const { festivalSettings, updateFestivalSettings } = useFestivalSettings();

  async function handleToggle(key: keyof FestivalSettings, value: boolean) {
    await updateFestivalSettings({ [key]: value });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-2xl space-y-4 pb-8"
    >
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to={ROUTES.SETTINGS}>
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => updateFestivalSettings(DEFAULT_FESTIVAL_SETTINGS)}
        >
          Reset Defaults
        </Button>
      </div>

      <Card className="border-border/80 bg-card/85">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle>Festivals &amp; Holidays</CardTitle>
          </div>
          <CardDescription>
            Control which cultural observances, national holidays, and regional festivals appear on your calendar. Stored offline in IndexedDB.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Master Toggle */}
          <ToggleRow
            id="festivals-enabled"
            label="Show Festivals & Holidays on Calendar"
            description="Display subtle festival indicators on calendar dates and in the date detail panel."
            checked={festivalSettings.festivalsEnabled}
            onChange={(val) => void handleToggle("festivalsEnabled", val)}
          />

          {/* Region Selector */}
          <div className="space-y-1.5 rounded-xl border border-border/70 bg-background/70 p-3.5">
            <label htmlFor="festival-region" className="block text-sm font-medium text-foreground">
              Primary Region
            </label>
            <p className="text-xs text-muted-foreground">
              Prioritize regional and state holidays for your selected area (national holidays are included for Indian regions).
            </p>
            <select
              id="festival-region"
              value={festivalSettings.festivalsRegion}
              disabled={!festivalSettings.festivalsEnabled}
              onChange={(e) =>
                void updateFestivalSettings({
                  festivalsRegion: e.target.value as FestivalRegion | "all",
                })
              }
              className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Toggles */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </h3>
            <div className="grid gap-2">
              <ToggleRow
                id="cat-national"
                label="National Holidays"
                description="Republic Day, Independence Day, Gandhi Jayanti, etc."
                checked={festivalSettings.festivalsShowNational}
                disabled={!festivalSettings.festivalsEnabled}
                onChange={(val) => void handleToggle("festivalsShowNational", val)}
              />
              <ToggleRow
                id="cat-state"
                label="State Holidays"
                description="Tamil Nadu state observances like Thiruvalluvar Day, Uzhavar Thirunal, May Day."
                checked={festivalSettings.festivalsShowState}
                disabled={!festivalSettings.festivalsEnabled}
                onChange={(val) => void handleToggle("festivalsShowState", val)}
              />
              <ToggleRow
                id="cat-hindu"
                label="Hindu Festivals"
                description="Pongal, Deepavali, Vinayagar Chaturthi, Ayudha Pooja, Krishna Jayanthi."
                checked={festivalSettings.festivalsShowHindu}
                disabled={!festivalSettings.festivalsEnabled}
                onChange={(val) => void handleToggle("festivalsShowHindu", val)}
              />
              <ToggleRow
                id="cat-muslim"
                label="Muslim Festivals"
                description="Eid al-Fitr (Ramzan), Eid al-Adha (Bakrid), Milad-un-Nabi."
                checked={festivalSettings.festivalsShowMuslim}
                disabled={!festivalSettings.festivalsEnabled}
                onChange={(val) => void handleToggle("festivalsShowMuslim", val)}
              />
              <ToggleRow
                id="cat-christian"
                label="Christian Festivals"
                description="Christmas, Good Friday."
                checked={festivalSettings.festivalsShowChristian}
                disabled={!festivalSettings.festivalsEnabled}
                onChange={(val) => void handleToggle("festivalsShowChristian", val)}
              />
              <ToggleRow
                id="cat-regional"
                label="Regional & Cultural Celebrations"
                description="Tamil New Year (Puthandu), Onam, and cultural observances."
                checked={festivalSettings.festivalsShowRegional}
                disabled={!festivalSettings.festivalsEnabled}
                onChange={(val) => void handleToggle("festivalsShowRegional", val)}
              />
              <ToggleRow
                id="cat-international"
                label="International Observances"
                description="Optional global dates like New Year's Day."
                checked={festivalSettings.festivalsShowInternational}
                disabled={!festivalSettings.festivalsEnabled}
                onChange={(val) => void handleToggle("festivalsShowInternational", val)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

