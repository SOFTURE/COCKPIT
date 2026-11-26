"use client";

import {
  ICON_STROKE_WIDTH,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@softure-ai/theme-notion";
import { CalendarClock, FolderKanban, Inbox, Megaphone, Package, Rocket, Settings, type LucideIcon } from "lucide-react";
import { AppLink } from "./app-link.tsx";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AppMessages } from "../../messages/index.ts";
import type { GroupedProject, ProjectGroupSection } from "../projects/group-projects.ts";
import { isActivePath, NAVIGATION, type NavigationKey } from "./navigation.ts";

const ICONS: Readonly<Record<NavigationKey, LucideIcon>> = {
  inbox: Inbox,
  broadcast: Megaphone,
  scheduled: CalendarClock,
  projects: FolderKanban,
  packages: Package,
  deploys: Rocket,
  settings: Settings,
};

export interface SidebarProject extends GroupedProject {
  readonly slug: string;
  readonly name: string;
  readonly statusIcon?: ReactNode;
}

export interface AppSidebarProps {
  readonly copy: AppMessages["shell"];
  readonly inboxCount: number;
  /** The watched projects in the owner's groups, as `groupProjects` laid them out (CT-33); the sidebar keeps the order. */
  readonly projectSections: readonly ProjectGroupSection<SidebarProject>[];
  readonly footer: ReactNode;
}

export function AppSidebar({ copy, inboxCount, projectSections, footer }: AppSidebarProps) {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="offcanvas" mobileTitle={copy.mobileTitle} mobileDescription={copy.mobileDescription}>
      <SidebarHeader>
        <span className="px-2 py-1 text-ui font-semibold">{copy.product}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu aria-label={copy.navigationLabel}>
              {NAVIGATION.map((item) => {
                const Icon = ICONS[item.key];
                const isActive = isActivePath(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive} className="min-h-touch-target md:min-h-row-height">
                      <AppLink href={item.href} aria-current={isActive ? "page" : undefined}>
                        <Icon aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} />
                        <span>{copy[item.key]}</span>
                      </AppLink>
                    </SidebarMenuButton>
                    {item.key === "inbox" && inboxCount > 0 ? <SidebarMenuBadge>{inboxCount}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {projectSections.length === 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>{copy.projects}</SidebarGroupLabel>
            <SidebarGroupContent>
              <p className="px-2 text-small text-muted-foreground">{copy.projectsEmpty}</p>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          projectSections.map((section) => {
            const name = section.group === null ? copy.projectsNoGroup : section.group.name;
            return (
              <SidebarGroup key={section.group?.id ?? "none"} data-group={section.group?.id ?? "none"}>
                <SidebarGroupLabel>
                  <span className="truncate" title={name}>
                    {name}
                  </span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu aria-label={name}>
                    {section.projects.map((project) => (
                      <SidebarProjectLink key={project.slug} project={project} pathname={pathname} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })
        )}
      </SidebarContent>
      <SidebarFooter>{footer}</SidebarFooter>
    </Sidebar>
  );
}

function SidebarProjectLink({ project, pathname }: { readonly project: SidebarProject; readonly pathname: string }) {
  const href = `/projects/${project.slug}`;
  const isActive = isActivePath(pathname, href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className="min-h-touch-target md:min-h-row-height">
        <AppLink href={href} aria-current={isActive ? "page" : undefined}>
          {project.statusIcon}
          <span className="truncate">{project.name}</span>
        </AppLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
