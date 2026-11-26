// The shared group sections (CT-32): one section per group in the order `groupProjects` gives, each with its name and a
// muted count over a list of the caller's rows, No group last under its own name, and nothing for no sections.
import { ListItem } from "@softure-ai/theme-notion";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { createGroupCollator, groupProjects } from "../../src/projects/group-projects.ts";
import { ProjectGroupSections } from "../../src/projects/project-group-sections.tsx";

interface Project {
  readonly key: string;
  readonly groupId: number | null;
}

const COLLATOR = createGroupCollator("en");
const GROUPS = [
  { id: 2, name: "Zeta desk" },
  { id: 1, name: "Atlas clients" },
  { id: 3, name: "Empty desk" },
];
const PROJECTS: Project[] = [
  { key: "zeta-works/one", groupId: 2 },
  { key: "atlas-works/two", groupId: 1 },
  { key: "example-org/loose", groupId: null },
  { key: "atlas-works/three", groupId: 1 },
];

function render(projects: readonly Project[], locale: "en" | "pl" = "en"): string {
  const copy = getMessages(locale).projectGroupSections;
  return renderToStaticMarkup(
    <ProjectGroupSections
      sections={groupProjects(projects, GROUPS, { collator: COLLATOR })}
      copy={copy}
      listLabel={copy.projectsListLabel}
      getKey={(project) => project.key}
      renderRow={(project) => <ListItem data-row={project.key}>{project.key}</ListItem>}
    />,
  );
}

function sections(html: string): { label: string | undefined; heading: string | undefined; list: string | undefined; rows: string[] }[] {
  return [...html.matchAll(/<section aria-label="([^"]*)"[^>]*>(.*?)<\/section>/g)].map((match) => {
    const body = match[2] ?? "";
    return {
      label: match[1],
      heading: /<h2[^>]*>(.*?)<\/h2>/.exec(body)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      list: /<ul[^>]*aria-label="([^"]*)"/.exec(body)?.[1],
      rows: [...body.matchAll(/data-row="([^"]*)"/g)].map((row) => row[1] ?? ""),
    };
  });
}

describe("ProjectGroupSections", () => {
  it("shows one section per group in name order, each with its name, count and labelled list, No group last", () => {
    expect(sections(render(PROJECTS))).toEqual([
      { label: "Group: Atlas clients", heading: "Atlas clients 2", list: "Projects: Atlas clients", rows: ["atlas-works/two", "atlas-works/three"] },
      { label: "Group: Zeta desk", heading: "Zeta desk 1", list: "Projects: Zeta desk", rows: ["zeta-works/one"] },
      { label: "Group: No group", heading: "No group 1", list: "Projects: No group", rows: ["example-org/loose"] },
    ]);
  });

  it("leaves out an empty group and No group when every project has a group", () => {
    const labels = sections(render(PROJECTS.filter((project) => project.groupId !== null))).map((section) => section.label);
    expect(labels).toEqual(["Group: Atlas clients", "Group: Zeta desk"]);
  });

  it("puts the count in the muted small text after the name, in a semibold heading", () => {
    const html = render(PROJECTS);
    expect(html).toContain('<h2 class="flex items-baseline gap-2 text-ui font-semibold"><span>Atlas clients</span><span class="text-small font-normal text-muted-foreground" data-slot="project-group-count">2</span></h2>');
  });

  it("names the sections in the app's language", () => {
    const copy = getMessages("pl").projectGroupSections;
    expect(sections(render(PROJECTS, "pl")).at(-1)).toMatchObject({
      label: copy.sectionLabel.replace("{name}", copy.noGroup),
      heading: `${copy.noGroup} 1`,
      list: copy.projectsListLabel.replace("{group}", copy.noGroup),
    });
    expect(copy.noGroup).not.toBe(getMessages("en").projectGroupSections.noGroup);
  });

  it("draws nothing for no projects", () => {
    expect(render([])).toBe("");
  });

  it("stacks the caller's blocks under the same heading without a list for cards (CT-35)", () => {
    const copy = getMessages("en").projectGroupSections;
    const html = renderToStaticMarkup(
      <ProjectGroupSections
        layout="stack"
        sections={groupProjects(PROJECTS, GROUPS, { collator: COLLATOR })}
        copy={copy}
        getKey={(project) => project.key}
        renderRow={(project) => <div data-row={project.key}>{project.key}</div>}
      />,
    );
    expect(sections(html)).toEqual([
      { label: "Group: Atlas clients", heading: "Atlas clients 2", list: undefined, rows: ["atlas-works/two", "atlas-works/three"] },
      { label: "Group: Zeta desk", heading: "Zeta desk 1", list: undefined, rows: ["zeta-works/one"] },
      { label: "Group: No group", heading: "No group 1", list: undefined, rows: ["example-org/loose"] },
    ]);
    expect(html).not.toContain("<ul");
    expect(html).toContain('<div class="grid gap-4" data-slot="project-group-stack">');
  });
});
