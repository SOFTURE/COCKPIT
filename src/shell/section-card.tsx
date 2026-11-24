// A titled card of a screen, as on Settings: an h2 title, an optional count and one line of explanation, the
// section's action on the right, its content below. The card is a named region for assistive technology.
import { Badge, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@softure-ai/theme-notion";
import type { ReactNode } from "react";

export interface SectionCardProps {
  readonly id: string;
  readonly title: string;
  readonly description?: ReactNode;
  readonly count?: number;
  readonly action?: ReactNode;
  /** `wrap` moves the action under the title on a phone, for an action wider than a button (a progress bar). */
  readonly actionPlacement?: "side" | "wrap";
  readonly children?: ReactNode;
}

export function SectionCard({ id, title, description, count, action, actionPlacement = "side", children }: SectionCardProps) {
  return (
    <Card aria-labelledby={id} role="region" className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <h2 id={id} className="text-heading-3">
            {title}
          </h2>
          {count === undefined ? null : (
            <Badge variant="tag" color="gray" data-count>
              {count}
            </Badge>
          )}
        </CardTitle>
        {description === undefined ? null : <CardDescription>{description}</CardDescription>}
        {action === undefined ? null : (
          <CardAction className={actionPlacement === "wrap" ? "max-sm:col-span-2 max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-auto max-sm:justify-self-start" : undefined}>{action}</CardAction>
        )}
      </CardHeader>
      {children === undefined ? null : <CardContent className="px-5">{children}</CardContent>}
    </Card>
  );
}
