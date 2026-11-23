import { LogoutButton } from "@softure-ai/auth/next";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@softure-ai/theme-notion";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { AppSidebar, type SidebarProject } from "./app-sidebar.tsx";

export interface AppShellProps {
  readonly copy: AppMessages["shell"];
  readonly email: string;
  readonly inboxCount: number;
  readonly projects: readonly SidebarProject[];
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

/** The Notion-style shell: the sidebar (Inbox, Projects, Settings, the watched projects) and the page beside it. */
export function AppShell({ copy, email, inboxCount, projects, children }: AppShellProps) {
  const footer = (
    <div className="grid gap-1 px-2 pb-1">
      <p className="truncate text-small text-muted-foreground">{fillMessage(copy.signedInAs, { email })}</p>
      <LogoutButton variant="ghost" className={LOGOUT_ROW_CLASS} />
    </div>
  );
  return (
    <SidebarProvider>
      <AppSidebar copy={copy} inboxCount={inboxCount} projects={projects} footer={footer} />
      <SidebarInset className="min-w-0">
        <div className="flex items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),0.5rem)] md:hidden">
          <SidebarTrigger label={copy.toggleSidebar} />
        </div>
        <div className="mx-auto w-full max-w-content-width-wide px-4 py-6 md:px-12">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
