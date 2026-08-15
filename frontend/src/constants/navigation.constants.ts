import type { NavItem } from "@/types";

export const TOP_NAV_ITEMS: NavItem[] = [
  { label: "Calendar", href: "/calendar", icon: "CalendarDays" },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Calendar", href: "/calendar", icon: "CalendarDays" },
  { label: "Search", href: "/search", icon: "Search" },
  { label: "Add", href: "/calendar", icon: "Plus" },
  { label: "Timeline", href: "/timeline", icon: "GitBranch" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export const SIDEBAR_NAV_ITEMS: NavItem[] = TOP_NAV_ITEMS;
