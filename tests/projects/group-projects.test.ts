import { describe, expect, it } from "vitest";
import { createGroupCollator, groupProjects, sortGroups } from "../../src/projects/group-projects.ts";

const collator = createGroupCollator("pl");
const project = (name: string, groupId: number | null) => ({ name, groupId });
const names = (sections: ReturnType<typeof groupProjects<{ name: string; groupId: number | null }>>) =>
  sections.map((section) => [section.group?.name ?? null, section.projects.map((item) => item.name)]);

describe("groupProjects", () => {
  it("puts every project under No group when there is no group", () => {
    expect(names(groupProjects([project("alpha", null), project("beta", null)], [], { collator }))).toEqual([[null, ["alpha", "beta"]]]);
  });

  it("returns nothing for no project", () => {
    expect(groupProjects([], [{ id: 1, name: "Client work" }], { collator })).toEqual([]);
  });

  it("orders the groups by name and leaves No group out when every project is grouped", () => {
    const groups = [{ id: 1, name: "Zeta" }, { id: 2, name: "alpha" }];
    expect(names(groupProjects([project("one", 1), project("two", 2)], groups, { collator }))).toEqual([
      ["alpha", ["two"]],
      ["Zeta", ["one"]],
    ]);
  });

  it("puts the ungrouped projects last, under No group", () => {
    const groups = [{ id: 1, name: "Client work" }];
    expect(names(groupProjects([project("loose", null), project("kept", 1)], groups, { collator }))).toEqual([
      ["Client work", ["kept"]],
      [null, ["loose"]],
    ]);
  });

  it("leaves an empty group out", () => {
    const groups = [{ id: 1, name: "Client work" }, { id: 2, name: "Empty" }];
    expect(names(groupProjects([project("kept", 1)], groups, { collator }))).toEqual([["Client work", ["kept"]]]);
  });

  it("sorts a name that starts with an accented capital with its base letter, before Zeta", () => {
    const groups = [{ id: 1, name: "Zeta" }, { id: 2, name: "Ölberg" }, { id: 3, name: "Émile" }, { id: 4, name: "Lima" }];
    const sections = groupProjects([project("a", 1), project("b", 2), project("c", 3), project("d", 4)], groups, { collator });
    expect(sections.map((section) => section.group?.name)).toEqual(["Émile", "Lima", "Ölberg", "Zeta"]);
  });

  it("keeps the caller's order inside a group", () => {
    const groups = [{ id: 1, name: "Client work" }];
    expect(names(groupProjects([project("zulu", 1), project("alpha", 1), project("mike", 1)], groups, { collator }))).toEqual([
      ["Client work", ["zulu", "alpha", "mike"]],
    ]);
  });

  it("treats a project of an unknown group as ungrouped", () => {
    expect(names(groupProjects([project("orphan", 7)], [], { collator }))).toEqual([[null, ["orphan"]]]);
  });
});

describe("sortGroups", () => {
  it("keeps empty groups and orders by the locale's collation", () => {
    expect(sortGroups([{ id: 1, name: "beta" }, { id: 2, name: "Alpha" }], { collator }).map((group) => group.name)).toEqual(["Alpha", "beta"]);
  });
});
