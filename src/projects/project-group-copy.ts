// The words of the project groups (CT-30): a count in the locale's plural form, and the message of a failure code.
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ProjectGroupError } from "../../modules/projects/groups.ts";

type Copy = AppMessages["projectGroups"];
type PluralCopy = Copy["projectCount"];

/** One of a plural message's forms for `count`, filled in. */
export function formatCount(locale: string, forms: PluralCopy, count: number): string {
  const category = new Intl.PluralRules(locale).select(count);
  const form = category === "one" || category === "few" || category === "many" ? forms[category] : forms.other;
  return fillMessage(form, { count });
}

export type ProjectGroupFailure = ProjectGroupError | "projects.group_invalid";

/** The message of a project group failure; anything not about the group's fields is the general one. */
export function describeProjectGroupError(copy: Copy, error: ProjectGroupFailure): string {
  switch (error) {
    case "projects.group_name_taken":
      return copy.errors.name_taken;
    case "projects.group_owner_taken":
      return copy.errors.owner_taken;
    case "projects.group_not_found":
    case "projects.group_invalid":
      return copy.errors.not_found;
    default:
      return copy.errors.unexpected;
  }
}
