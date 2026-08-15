import { useMemo, useState } from "react";
import {
  Archive,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { CalendarBadge } from "@/components/calendar-workspace/CalendarBadge";
import { CalendarForm } from "@/components/calendar-workspace/CalendarForm";
import { CalendarWorkspaceDialog } from "@/components/calendar-workspace/CalendarWorkspaceDialog";
import { DeleteCalendarDialog } from "@/components/calendar-workspace/DeleteCalendarDialog";
import { Button } from "@/components/ui/button";
import { useCalendarWorkspaces } from "@/hooks";
import { cn } from "@/lib/utils";
import type { CalendarFormValues, CalendarWorkspace } from "@/types";

interface CalendarManagerProps {
  compact?: boolean;
}

export function CalendarManager({ compact = false }: CalendarManagerProps) {
  const workspace = useCalendarWorkspaces();
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<CalendarWorkspace | null>(null);
  const [deletingCalendar, setDeletingCalendar] = useState<CalendarWorkspace | null>(null);

  const activeCount = workspace.activeCalendars.length;
  const deleteBlockReason = useMemo(() => {
    if (!deletingCalendar) return undefined;
    if (!deletingCalendar.isArchived && activeCount <= 1) {
      return "You must keep at least one active calendar.";
    }
    if (deletingCalendar.isDefault) {
      return "Select another default calendar before deleting this one.";
    }
    return undefined;
  }, [activeCount, deletingCalendar]);

  async function handleSubmit(values: CalendarFormValues) {
    if (formMode === "edit" && editingCalendar) {
      await workspace.updateCalendar(editingCalendar.id, values);
    } else {
      await workspace.createCalendar(values);
    }
    setFormMode(null);
    setEditingCalendar(null);
  }

  function openEdit(calendar: CalendarWorkspace) {
    setEditingCalendar(calendar);
    setFormMode("edit");
  }

  async function archive(calendar: CalendarWorkspace) {
    await workspace.archiveCalendar(calendar.id);
  }

  async function restore(calendar: CalendarWorkspace) {
    await workspace.restoreCalendar(calendar.id);
  }

  return (
    <div className={cn("grid gap-5", compact && "gap-4")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Calendars</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the spaces your life will attach to in Phase 5.
          </p>
        </div>
        <Button size="sm" onClick={() => setFormMode("create")}>
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      <div className="grid gap-2">
        {workspace.activeCalendars.map((calendar) => (
          <div
            key={calendar.id}
            className="rounded-lg border border-border/60 bg-background/45 p-3"
          >
            <CalendarBadge calendar={calendar} selected={workspace.selectedCalendarId === calendar.id} />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <IconAction label="Edit" icon={Pencil} onClick={() => openEdit(calendar)} />
              <IconAction
                label={calendar.isVisible ? "Hide" : "Show"}
                icon={calendar.isVisible ? EyeOff : Eye}
                onClick={() => workspace.updateCalendar(calendar.id, { isVisible: !calendar.isVisible })}
              />
              <IconAction
                label="Default"
                icon={Star}
                disabled={calendar.isDefault}
                onClick={() => workspace.setDefaultCalendar(calendar.id)}
              />
              <IconAction label="Duplicate" icon={Copy} onClick={() => workspace.duplicateCalendar(calendar.id)} />
              <IconAction
                label="Archive"
                icon={Archive}
                disabled={activeCount <= 1 || calendar.isDefault}
                onClick={() => archive(calendar)}
              />
              <IconAction label="Delete" icon={Trash2} onClick={() => setDeletingCalendar(calendar)} danger />
            </div>
          </div>
        ))}
      </div>

      {workspace.archivedCalendars.length > 0 && (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Archived</p>
          {workspace.archivedCalendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
            >
              <CalendarBadge calendar={calendar} compact />
              <div className="flex items-center gap-1">
                <IconAction label="Restore" icon={RotateCcw} onClick={() => restore(calendar)} />
                <IconAction label="Delete" icon={Trash2} onClick={() => setDeletingCalendar(calendar)} danger />
              </div>
            </div>
          ))}
        </div>
      )}

      <CalendarWorkspaceDialog
        open={formMode !== null}
        title={formMode === "edit" ? "Edit Calendar" : "Create Calendar"}
        onClose={() => {
          setFormMode(null);
          setEditingCalendar(null);
        }}
      >
        <CalendarForm
          calendars={workspace.calendars}
          calendar={formMode === "edit" ? editingCalendar : null}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormMode(null);
            setEditingCalendar(null);
          }}
          submitLabel={formMode === "edit" ? "Save Changes" : "Create Calendar"}
        />
      </CalendarWorkspaceDialog>

      <DeleteCalendarDialog
        calendar={deletingCalendar}
        disabledReason={deleteBlockReason}
        onCancel={() => setDeletingCalendar(null)}
        onConfirm={async () => {
          if (!deletingCalendar) return;
          await workspace.deleteCalendar(deletingCalendar.id);
          setDeletingCalendar(null);
        }}
      />
    </div>
  );
}

interface IconActionProps {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

function IconAction({ label, icon: Icon, onClick, disabled = false, danger = false }: IconActionProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-8 px-2 text-xs", danger && "text-destructive hover:text-destructive")}
      aria-label={label}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
