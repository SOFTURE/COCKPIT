// One setting on the Settings screen (and on a project's Settings tab, CT-31): its title with a "?" that explains it,
// an optional status after the title (e.g. "Saved", announced politely), and its single action on the right. With
// `stackOnPhone` the action sits under the title at full width below `md` (a select or a field, not a button).
import { useId, type ReactNode } from "react";
import { LabelWithHelp } from "../shell/field-help.tsx";

export interface SettingsRowProps {
  readonly title: string;
  readonly hint: string;
  /** The "?" button's name, e.g. "Help: Password". */
  readonly helpLabel: string;
  readonly action: ReactNode;
  /** A short muted state after the title, read out by screen readers when it changes; empty renders nothing visible. */
  readonly status?: ReactNode;
  readonly stackOnPhone?: boolean;
}

export function SettingsRow({ title, hint, helpLabel, action, status, stackOnPhone = false }: SettingsRowProps) {
  const hintId = useId();
  const layout = stackOnPhone
    ? "flex flex-col items-stretch gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-4"
    : "flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0";
  return (
    <li className={layout} aria-describedby={hintId}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
        <LabelWithHelp id={hintId} label={helpLabel} text={hint}>
          <h3 className="font-medium">{title}</h3>
        </LabelWithHelp>
        {status === undefined ? null : (
          <span className="text-small text-muted-foreground" aria-live="polite" data-settings-row-status>
            {status}
          </span>
        )}
      </div>
      <div className={stackOnPhone ? "flex min-w-0 flex-col md:shrink-0 md:items-end" : "flex shrink-0 items-center"}>{action}</div>
    </li>
  );
}
