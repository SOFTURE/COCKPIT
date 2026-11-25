// One setting on the Settings screen: its title with a "?" that explains it, and its single action on the right.
import { useId, type ReactNode } from "react";
import { LabelWithHelp } from "../shell/field-help.tsx";

export interface SettingsRowProps {
  readonly title: string;
  readonly hint: string;
  /** The "?" button's name, e.g. "Help: Password". */
  readonly helpLabel: string;
  readonly action: ReactNode;
}

export function SettingsRow({ title, hint, helpLabel, action }: SettingsRowProps) {
  const hintId = useId();
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0" aria-describedby={hintId}>
      <div className="min-w-0 flex-1">
        <LabelWithHelp id={hintId} label={helpLabel} text={hint}>
          <h3 className="font-medium">{title}</h3>
        </LabelWithHelp>
      </div>
      <div className="flex shrink-0 items-center">{action}</div>
    </li>
  );
}
