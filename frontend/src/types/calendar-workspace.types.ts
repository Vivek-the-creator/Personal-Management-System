export interface CalendarWorkspace {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
  isDefault: boolean;
  isVisible: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarFormValues {
  name: string;
  emoji: string;
  color: string;
  description?: string;
  isDefault: boolean;
}

export type CalendarUpdateBody = Partial<CalendarFormValues> & {
  isVisible?: boolean;
};
