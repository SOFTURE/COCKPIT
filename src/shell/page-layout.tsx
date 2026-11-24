// The one layout of every screen inside the app shell (CV-4): the theme's PageLayout (@softure-ai/theme-notion 0.31),
// full width, its page header (title, crumbs, description, actions) and the screen's sections below it, one gap apart.
// Screens pass the header's props flat. Titled sections use SectionCard. A test fails when a page under app/(app)/
// renders without it or caps its own width.
import { PageLayout as ThemePageLayout, type PageHeaderProps } from "@softure-ai/theme-notion";
import type { ReactNode } from "react";

export interface PageLayoutProps extends Omit<PageHeaderProps, "children" | "className"> {
  readonly children?: ReactNode;
}

export function PageLayout({ children, ...header }: PageLayoutProps) {
  return <ThemePageLayout header={header}>{children}</ThemePageLayout>;
}
