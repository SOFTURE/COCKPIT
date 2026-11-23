// The shell's main destinations, in sidebar order (FR-1, the brief's shell: Inbox, Projects, Settings).
export type NavigationKey = "inbox" | "projects" | "settings";

export interface NavigationItem {
  readonly key: NavigationKey;
  readonly href: string;
}

export const NAVIGATION: readonly NavigationItem[] = [
  { key: "inbox", href: "/inbox" },
  { key: "projects", href: "/projects" },
  { key: "settings", href: "/settings" },
];

/** Whether `pathname` is the destination or a page below it. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
