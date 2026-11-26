// The rules of a project picker in groups (CT-34, shared by `ProjectPicker` since CT-38): which projects are picked, how
// a group's checkbox reads (all, some or none of its projects picked) and what toggling one project, a group or every
// project does. Pure, so the picker only calls them.

export type GroupPickState = "all" | "some" | "none";

/** How many of these projects are picked; a picked key that is not among them never counts. */
export function countPicked(keys: readonly string[], picked: ReadonlySet<string>): number {
  return keys.filter((key) => picked.has(key)).length;
}

/** A group's checkbox: all when every project is picked, none when no project is (an empty group too), some otherwise. */
export function getGroupPickState(keys: readonly string[], picked: ReadonlySet<string>): GroupPickState {
  const count = countPicked(keys, picked);
  if (count === 0) {
    return "none";
  }
  return count === keys.length ? "all" : "some";
}

/** Picks or clears these projects (one, a group, or every project) and leaves every other pick as it was. */
export function setPicked(picked: ReadonlySet<string>, keys: readonly string[], isPicked: boolean): ReadonlySet<string> {
  const next = new Set(picked);
  for (const key of keys) {
    if (isPicked) {
      next.add(key);
    } else {
      next.delete(key);
    }
  }
  return next;
}
