// One setting on the Settings screen: what it is and one line on what it does, with its single action on the right.
import type { ReactNode } from "react";

export interface SettingsRowProps {
  readonly title: string;
  readonly hint: string;
  readonly action: ReactNode;
}

export function SettingsRow({ title, hint, action }: SettingsRowProps) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <h3 className="font-medium">{title}</h3>
        <p className="text-small text-muted-foreground">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center">{action}</div>
    </li>
  );
}
