// The one tab pattern of every screen with several sections (CT-21): the theme's TabBar with each tab a link (the shown
// tab in the address), touch-sized on a phone and the control height from md up, an icon before the label and an
// optional count after it; and the panel under it, marked with the shown tab.
import { TabBar } from "@softure-ai/theme-notion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Touch-sized tabs on a phone, the theme's control height from md up (as the other actions). */
const TAB_SIZE = "md:h-control-height md:min-w-0";

export interface PageTab<Key extends string> {
  readonly key: Key;
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
  /** Undefined when the tab shows no counter. */
  readonly count?: number | undefined;
}

export function PageTabs<Key extends string>({ label, tabs, current }: { readonly label: string; readonly tabs: readonly PageTab<Key>[]; readonly current: Key }) {
  return (
    <TabBar
      label={label}
      size="touch"
      tabClassName={TAB_SIZE}
      current={current}
      tabs={tabs.map(({ key, label: tabLabel, href, icon: Icon, count }) => ({
        key,
        label: tabLabel,
        href,
        icon: <Icon aria-hidden="true" />,
        ...(count === undefined ? {} : { count }),
      }))}
    />
  );
}

export function TabPanel({ current, children }: { readonly current: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-4" data-tab-panel={current}>
      {children}
    </div>
  );
}
