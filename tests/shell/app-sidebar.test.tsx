// CT-33: the sidebar's project links sit under one theme label per project group, in the order `groupProjects` gives,
// No group last; with no projects the single "Projects" label and its empty line stay.
import { SidebarProvider } from "@softure-ai/theme-notion";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { createGroupCollator, groupProjects } from "../../src/projects/group-projects.ts";
import { AppSidebar, type SidebarProject } from "../../src/shell/app-sidebar.tsx";

vi.mock("next/navigation", () => ({ usePathname: () => "/projects/pine-yard/pine-app" }));

const copy = getMessages("en").shell;
const GROUPS = [
  { id: 2, name: "Pine desk" },
  { id: 1, name: "Maple desk" },
  { id: 3, name: "Empty desk" },
];

function project(slug: string, groupId: number | null): SidebarProject {
  return { slug, name: slug, groupId, statusIcon: <span data-status="waiting" /> };
}

const PROJECTS = [
  project("example-org/loose-app", null),
  project("maple-row/maple-app", 1),
  project("pine-yard/pine-app", 2),
  project("maple-row/maple-docs", 1),
];

function render(projects: readonly SidebarProject[]): string {
  const projectSections = groupProjects(projects, GROUPS, { collator: createGroupCollator("en") });
  return renderToStaticMarkup(
    <SidebarProvider>
      <AppSidebar copy={copy} inboxCount={0} projectSections={projectSections} footer={null} />
    </SidebarProvider>,
  );
}

/** The text of a markup fragment: every run of characters between tags, joined. */
function textOf(html: string): string {
  return [...`>${html}<`.matchAll(/>([^<]*)</g)].map((match) => match[1] ?? "").join("");
}

function labels(markup: string): string[] {
  return [...markup.matchAll(/<div[^>]*data-sidebar="group-label"[^>]*>(.*?)<\/div>/g)].map((match) => textOf(match[1] ?? ""));
}

/** The markup of the menu labelled `group`, or null. */
function menu(markup: string, group: string): string | null {
  const match = new RegExp(`<ul[^>]*aria-label="${group}"[^>]*>(.*?)</ul>`).exec(markup);
  return match?.[1] ?? null;
}

function linksOf(markup: string, group: string): string[] {
  return [...(menu(markup, group) ?? "").matchAll(/<a[^>]*href="([^"]*)"/g)].map((match) => match[1] ?? "");
}

function anchors(html: string): string[] {
  return [...html.matchAll(/<a\b.*?<\/a>/g)].map((match) => match[0]);
}

describe("AppSidebar in project groups", () => {
  it("labels the groups in name order with No group last and leaves an empty group out", () => {
    expect(labels(render(PROJECTS))).toEqual(["Maple desk", "Pine desk", "No group"]);
  });

  it("lists each project under its group's menu, labelled with the group's name, in the given order", () => {
    const markup = render(PROJECTS);
    expect(linksOf(markup, "Maple desk")).toEqual(["/projects/maple-row/maple-app", "/projects/maple-row/maple-docs"]);
    expect(linksOf(markup, "Pine desk")).toEqual(["/projects/pine-yard/pine-app"]);
    expect(linksOf(markup, "No group")).toEqual(["/projects/example-org/loose-app"]);
    expect(menu(markup, "Projects")).toBeNull();
  });

  it("puts the full group name on hover and keeps each link's status icon, touch size and active state", () => {
    const markup = render(PROJECTS);
    expect(markup).toMatch(/data-sidebar="group-label"[^>]*><span class="truncate" title="Maple desk">Maple desk<\/span>/);
    const links = ["Maple desk", "Pine desk", "No group"].flatMap((group) => anchors(menu(markup, group) ?? ""));
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toContain('data-status="waiting"');
      expect(link).toMatch(/class="[^"]*min-h-touch-target[^"]*md:min-h-row-height/);
    }
    expect(anchors(menu(markup, "Pine desk") ?? "")[0]).toContain('aria-current="page"');
    expect(links.filter((link) => link.includes('aria-current="page"'))).toHaveLength(1);
  });

  it("shows only No group when no project has a group", () => {
    const markup = render(PROJECTS.map((item) => ({ ...item, groupId: null })));
    expect(labels(markup)).toEqual(["No group"]);
    expect(linksOf(markup, "No group")).toHaveLength(4);
  });

  it("keeps the single Projects label and its empty line with no projects", () => {
    const markup = render([]);
    expect(labels(markup)).toEqual(["Projects"]);
    expect(markup).toContain("No projects watched yet");
    expect(markup.match(/data-sidebar="menu"/g)).toHaveLength(1);
  });
});
