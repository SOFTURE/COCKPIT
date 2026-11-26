import { describe, expect, it } from "vitest";
import { en } from "../../messages/en.ts";
import { pl } from "../../messages/pl.ts";
import { describeProjectGroupError, formatCount } from "../../src/projects/project-group-copy.ts";
import { parseGroupId, parseProjectGroupInput } from "../../src/projects/project-group-input.ts";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

describe("parseProjectGroupInput", () => {
  it("trims the name and lower-cases the owner", () => {
    expect(parseProjectGroupInput(form({ name: "  Client work  ", owner: " Atlas-Works " }))).toEqual({
      ok: true,
      value: { name: "Client work", defaultOwner: "atlas-works" },
    });
  });

  it("reads an empty owner as none", () => {
    expect(parseProjectGroupInput(form({ name: "Side projects", owner: "  " }))).toEqual({ ok: true, value: { name: "Side projects", defaultOwner: null } });
    expect(parseProjectGroupInput(form({ name: "Side projects" }))).toEqual({ ok: true, value: { name: "Side projects", defaultOwner: null } });
  });

  it("accepts a name of exactly 1 and 60 characters", () => {
    expect(parseProjectGroupInput(form({ name: "A" }))).toMatchObject({ ok: true });
    expect(parseProjectGroupInput(form({ name: "x".repeat(60) }))).toMatchObject({ ok: true });
  });

  it("refuses an empty or blank name and one over 60 characters, naming the name field", () => {
    for (const name of ["", "   ", "x".repeat(61)]) {
      expect(parseProjectGroupInput(form({ name }))).toEqual({ ok: false, error: { field: "name", code: "name_invalid" } });
    }
  });

  it("refuses an owner outside the forge's form or over 39 characters, naming the owner field", () => {
    for (const owner of ["atlas works", "atlas/works", "a_b", "x".repeat(40)]) {
      expect(parseProjectGroupInput(form({ name: "Client work", owner }))).toEqual({ ok: false, error: { field: "owner", code: "owner_invalid" } });
    }
  });
});

describe("parseGroupId", () => {
  it("reads a positive whole number and refuses the rest", () => {
    expect(parseGroupId(form({ groupId: "12" }))).toBe(12);
    for (const groupId of ["", "0", "-3", "1.5", "abc"]) {
      expect(parseGroupId(form({ groupId }))).toBeNull();
    }
  });
});

describe("project group copy", () => {
  it("names a duplicate as the field error", () => {
    expect(describeProjectGroupError(en.projectGroups, "projects.group_name_taken")).toBe("A group with this name already exists.");
    expect(describeProjectGroupError(en.projectGroups, "projects.group_owner_taken")).toBe(en.projectGroups.errors.owner_taken);
    expect(describeProjectGroupError(en.projectGroups, "core.database_failed")).toBe(en.projectGroups.errors.unexpected);
  });

  it("counts projects in the locale's plural form", () => {
    expect([0, 1, 2].map((count) => formatCount("en", en.projectGroups.projectCount, count))).toEqual(["0 projects", "1 project", "2 projects"]);
    const forms = pl.projectGroups.projectCount;
    expect([1, 2, 5, 22].map((count) => formatCount("pl", forms, count))).toEqual([
      forms.one,
      forms.few.replace("{count}", "2"),
      forms.many.replace("{count}", "5"),
      forms.few.replace("{count}", "22"),
    ]);
  });
});
