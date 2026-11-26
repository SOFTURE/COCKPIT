import { LogoutButton } from "@softure-ai/auth/next";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@softure-ai/theme-notion";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ProjectGroupSection } from "../projects/group-projects.ts";
import { AppSidebar, type SidebarProject } from "./app-sidebar.tsx";

export interface AppShellProps {
  readonly copy: AppMessages["shell"];
  readonly email: string;
  readonly inboxCount: number;
  /** The sidebar's projects in the owner's groups (CT-33). */
  readonly projectSections: readonly ProjectGroupSection<SidebarProject>[];
  /** The right end of the header bar: the refresh of every project. */
  readonly headerActions: ReactNode;
  readonly children: ReactNode;
}

/**
 * Styles the logout button as a sidebar row whose text starts where the signed-in line starts: the row reaches out
 * over the footer's padding by the same amount its own padding pulls the text back in. `LogoutButton` puts
 * `className` on its form, not on the button, hence the descendant selectors.
 */
const LOGOUT_ROW_CLASS = [
  "-mx-2",
  "[&_button]:w-full",
  "[&_button]:justify-start",
  "[&_button]:border-0",
  "[&_button]:px-2",
  "[&_button]:h-auto",
  "[&_button]:min-h-touch-target",
  "md:[&_button]:min-h-row-height",
].join(" ");

/**
 * The Notion-style shell: the sidebar (Inbox, Projects, Settings, the watched projects in their groups) and the page
 * beside it, under a header bar in the SOFTURE apps' top bar style (a bordered row): the menu button on a phone on its
 * left, the refresh on its right (CT-9).
 */
export function AppShell({ copy, email, inboxCount, projectSections, headerActions, children }: AppShellProps) {
  const footer = (
    <div className="grid gap-1 px-2 pb-1">
      <p className="truncate text-small text-muted-foreground">{fillMessage(copy.signedInAs, { email })}</p>
      <LogoutButton variant="ghost" className={LOGOUT_ROW_CLASS} />
    </div>
  );
  return (
    <SidebarProvider>
      <AppSidebar copy={copy} inboxCount={inboxCount} projectSections={projectSections} footer={footer} />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-2 pb-1 pt-[max(env(safe-area-inset-top),0.25rem)] md:px-4">
          <div className="md:hidden">
            <SidebarTrigger label={copy.toggleSidebar} />
          </div>
          <div className="ml-auto min-w-0">{headerActions}</div>
        </header>
        <div className="w-full px-4 py-6 md:px-8 xl:px-12">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
