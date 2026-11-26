// What the project group forms send, narrowed at the boundary (CT-30): a name trimmed to 1..60 characters and an
// optional "new projects from" owner, trimmed and lower-cased, in the forge's owner form. A failure names its field.
import { z } from "zod";
import type { ProjectGroupInput } from "../../modules/projects/groups.ts";

export type ProjectGroupField = "name" | "owner";

export type ProjectGroupInputError = { readonly field: "name"; readonly code: "name_invalid" } | { readonly field: "owner"; readonly code: "owner_invalid" };

export type ParsedProjectGroupInput =
  | { readonly ok: true; readonly value: ProjectGroupInput }
  | { readonly ok: false; readonly error: ProjectGroupInputError };

const nameSchema = z.string().trim().min(1).max(60);
const ownerSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,39}$/).or(z.string().trim().length(0));
const groupIdSchema = z.coerce.number().int().positive();

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function parseProjectGroupInput(formData: FormData): ParsedProjectGroupInput {
  const name = nameSchema.safeParse(readText(formData, "name"));
  if (!name.success) {
    return { ok: false, error: { field: "name", code: "name_invalid" } };
  }
  const owner = ownerSchema.safeParse(readText(formData, "owner"));
  if (!owner.success) {
    return { ok: false, error: { field: "owner", code: "owner_invalid" } };
  }
  return { ok: true, value: { name: name.data, defaultOwner: owner.data === "" ? null : owner.data } };
}

/** The group a form names (`groupId`); null when it is not a positive whole number. */
export function parseGroupId(formData: FormData, field = "groupId"): number | null {
  const parsed = groupIdSchema.safeParse(readText(formData, field));
  return parsed.success ? parsed.data : null;
}
