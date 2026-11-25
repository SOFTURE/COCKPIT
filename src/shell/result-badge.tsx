// A result as one filled tag (CT-18): the icon and the word, in the colour of its tone, the same on every screen:
// green done or fired, red failed, orange needs attention, grey none or pending. The colours are the theme's tones;
// each screen only says which of its states takes which tone (and, when it has a better one, which icon).
import { Badge, TONE_COLORS, type Tone } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, CircleX, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ResultTone = Exclude<Tone, "default">;

type ResultColor = NonNullable<(typeof TONE_COLORS)[ResultTone]>;

const TONE_ICONS: Readonly<Record<ResultTone, LucideIcon>> = {
  success: CircleCheck,
  danger: CircleX,
  warning: TriangleAlert,
  muted: CircleDashed,
};

/** The one colour a result tone takes. */
export function getResultColor(tone: ResultTone): ResultColor {
  // Every tone but `default` has a palette colour in the theme.
  return TONE_COLORS[tone] as ResultColor;
}

export interface ResultBadgeProps {
  readonly tone: ResultTone;
  /** The word: a result always carries one, so results read apart without telling colours apart. */
  readonly children: ReactNode;
  /** The state's own icon; the tone's icon when left out. */
  readonly icon?: LucideIcon;
  readonly title?: string;
  readonly data?: Readonly<Record<`data-${string}`, string>>;
}

export function ResultBadge({ tone, children, icon, title, data }: ResultBadgeProps) {
  const Icon = icon ?? TONE_ICONS[tone];
  return (
    <Badge variant="tag" color={getResultColor(tone)} title={title} {...data} data-result={tone}>
      <Icon aria-hidden="true" />
      {children}
    </Badge>
  );
}
