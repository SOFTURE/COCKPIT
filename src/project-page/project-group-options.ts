// The options of a project's group select (CT-31): the owner's groups in the order every grouped surface shows them
// (`sortGroups`, the locale's collation), then No group; the selected value is the project's group, or No group when
// it has none or its group is gone. Radix forbids an empty item value, so No group is the value `none`.
import { sortGroups, type GroupRef } from "../projects/group-projects.ts";

export const NO_GROUP_VALUE = "none";

export interface ProjectGroupOptions {
  readonly groups: readonly { readonly value: string; readonly label: string }[];
  readonly selected: string;
}

export function buildProjectGroupOptions(groups: readonly GroupRef[], currentGroupId: number | null, collator: Intl.Collator): ProjectGroupOptions {
  const ordered = sortGroups(groups, { collator }).map((group) => ({ value: String(group.id), label: group.name }));
  const isKnown = currentGroupId !== null && groups.some((group) => group.id === currentGroupId);
  return { groups: ordered, selected: isKnown ? String(currentGroupId) : NO_GROUP_VALUE };
}

/** The `groupId` the action takes: empty for No group. */
export function toGroupIdField(value: string): string {
  return value === NO_GROUP_VALUE ? "" : value;
}
