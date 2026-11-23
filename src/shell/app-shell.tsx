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

/** The Notion-style shell: the sidebar (Inbox, Projects, Settings, the watched projects) and the page beside it. */
export function AppShell({ copy, email, inboxCount, projects, children }: AppShellProps) {
  const footer = (
    <div className="grid gap-1 px-2 pb-1">
      <p className="truncate text-small text-muted-foreground">{fillMessage(copy.signedInAs, { email })}</p>
      <LogoutButton variant="ghost" />
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
