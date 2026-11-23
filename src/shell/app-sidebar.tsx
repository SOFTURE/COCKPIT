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
import { FolderKanban, Inbox, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AppMessages } from "../../messages/index.ts";
import { isActivePath, NAVIGATION, type NavigationKey } from "./navigation.ts";

const ICONS: Readonly<Record<NavigationKey, LucideIcon>> = { inbox: Inbox, projects: FolderKanban, settings: Settings };

export interface SidebarProject {
  readonly slug: string;
  readonly name: string;
  readonly statusIcon?: ReactNode;
}

export interface AppSidebarProps {
  readonly copy: AppMessages["shell"];
  readonly inboxCount: number;
  readonly projects: readonly SidebarProject[];
  readonly footer: ReactNode;
}

export function AppSidebar({ copy, inboxCount, projects, footer }: AppSidebarProps) {
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
                      <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                        <Icon aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} />
                        <span>{copy[item.key]}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.key === "inbox" && inboxCount > 0 ? <SidebarMenuBadge>{inboxCount}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{copy.projects}</SidebarGroupLabel>
          <SidebarGroupContent>
            {projects.length === 0 ? (
              <p className="px-2 text-small text-muted-foreground">{copy.projectsEmpty}</p>
            ) : (
              <SidebarMenu aria-label={copy.projects}>
                {projects.map((project) => {
                  const href = `/projects/${project.slug}`;
                  const isActive = isActivePath(pathname, href);
                  return (
                    <SidebarMenuItem key={project.slug}>
                      <SidebarMenuButton asChild isActive={isActive} className="min-h-touch-target md:min-h-row-height">
                        <Link href={href} aria-current={isActive ? "page" : undefined}>
                          {project.statusIcon}
                          <span className="truncate">{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{footer}</SidebarFooter>
    </Sidebar>
  );
}
