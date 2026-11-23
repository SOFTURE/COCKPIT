import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, ICON_STROKE_WIDTH } from "@softure-ai/theme-notion";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

/** The empty state of a list screen: an icon, a title and one line on what fills it. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
