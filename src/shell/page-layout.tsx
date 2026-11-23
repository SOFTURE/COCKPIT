// The one layout of every screen inside the app shell (CV-4): the full width of the content area, the theme's page
// header (title, crumbs, description, actions) and the screen's sections below it, one gap apart. Titled sections use
// SectionCard. A test fails when a page under app/(app)/ renders without it or caps its own width.
import { PageHeader, type PageHeaderProps } from "@softure-ai/theme-notion";
import type { ReactNode } from "react";

export interface PageLayoutProps extends Omit<PageHeaderProps, "children" | "className"> {
  readonly children?: ReactNode;
}

export function PageLayout({ children, ...header }: PageLayoutProps) {
  return (
    <div data-page-layout="" className="grid w-full min-w-0 gap-4">
      <PageHeader {...header} />
      {children}
    </div>
  );
}
