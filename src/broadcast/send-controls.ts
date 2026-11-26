// Which controls a Broadcast project row shows (CT-23): at most one inline, the rest in the row menu (the theme ListEntry's rule).
// Retry send stays inline when it is there (a failed or stuck send is what the row is for), otherwise the Issue link;
// Retry fire is inline only when it is the row's one control.

export type SendControl = "issue" | "retry-fire" | "retry-send";

export interface SendControlFacts {
  readonly hasIssue: boolean;
  readonly canRetryFire: boolean;
  readonly canRetrySend: boolean;
}

export interface SendControls {
  /** The control shown on the row itself; null when the row has none. */
  readonly inline: SendControl | null;
  /** The rest, in this order: Issue, Retry fire, Retry send; empty when the row has one control or none. */
  readonly menu: readonly SendControl[];
}

const INLINE_PREFERENCE: readonly SendControl[] = ["retry-send", "issue", "retry-fire"];
const MENU_ORDER: readonly SendControl[] = ["issue", "retry-fire", "retry-send"];

/** The row's controls: the one inline and the ones in the menu. */
export function pickSendControls({ hasIssue, canRetryFire, canRetrySend }: SendControlFacts): SendControls {
  const present: ReadonlySet<SendControl> = new Set(
    MENU_ORDER.filter((control) => ({ issue: hasIssue, "retry-fire": canRetryFire, "retry-send": canRetrySend })[control]),
  );
  const inline = INLINE_PREFERENCE.find((control) => present.has(control)) ?? null;
  return { inline, menu: MENU_ORDER.filter((control) => present.has(control) && control !== inline) };
}
