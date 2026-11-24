// The shell's main destinations, in sidebar order (FR-1, the brief's shell: Inbox, Projects, Settings; CV-1 adds
// Broadcast, CT-1 Packages).
export type NavigationKey = "inbox" | "broadcast" | "projects" | "packages" | "settings";

export interface NavigationItem {
  readonly key: NavigationKey;
  readonly href: string;
}

export const NAVIGATION: readonly NavigationItem[] = [
  { key: "inbox", href: "/inbox" },
  { key: "broadcast", href: "/broadcast" },
  { key: "projects", href: "/projects" },
  { key: "packages", href: "/packages" },
  { key: "settings", href: "/settings" },
];

/** Whether `pathname` is the destination or a page below it. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
