import type { NavItem } from "@/types";

export const TOP_NAV_ITEMS: NavItem[] = [
  { label: "Calendar", href: "/calendar", icon: "CalendarDays" },
  { label: "Timeline", href: "/timeline", icon: "GitBranch" },
  { label: "Festivals", href: "/festivals", icon: "Sparkles" },
  { label: "Tools", href: "/tools", icon: "Calculator" },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Calendar", href: "/calendar", icon: "CalendarDays" },
  { label: "Search", href: "/search", icon: "Search" },
  { label: "Festivals", href: "/festivals", icon: "Sparkles" },
  { label: "Tools", href: "/tools", icon: "Calculator" },
  { label: "Timeline", href: "/timeline", icon: "GitBranch" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export const SIDEBAR_NAV_ITEMS: NavItem[] = TOP_NAV_ITEMS;
