// The digest's rule (FR-12): what shipped, what started waiting for the owner and what broke between the last
// digest's snapshot and now. A project that was not in the last snapshot reports nothing: its state is its baseline.
import type { BrokenReason } from "../status/project-status.ts";
import type { DigestSnapshot } from "./build-snapshot.ts";

export type ShippedLine =
  | { readonly kind: "item"; readonly projectKey: string; readonly projectName: string; readonly itemId: string; readonly outcome: string | null }
  | { readonly kind: "release"; readonly projectKey: string; readonly projectName: string; readonly version: string };

export interface WaitingLine {
  readonly projectKey: string;
  readonly projectName: string;
  readonly entryId: string;
  readonly text: string;
}

export interface BrokeLine {
  readonly projectKey: string;
  readonly projectName: string;
  readonly reasons: readonly BrokenReason[];
}

export interface DigestChanges {
  readonly shipped: readonly ShippedLine[];
  readonly waiting: readonly WaitingLine[];
  readonly broke: readonly BrokeLine[];
}

export function hasChanges(changes: DigestChanges): boolean {
  return changes.shipped.length + changes.waiting.length + changes.broke.length > 0;
}

export function compareSnapshots(previous: DigestSnapshot, current: DigestSnapshot): DigestChanges {
  const shipped: ShippedLine[] = [];
  const waiting: WaitingLine[] = [];
  const broke: BrokeLine[] = [];
  const keys = Object.keys(current.projects).sort((left, right) =>
    (current.projects[left]?.name ?? left).localeCompare(current.projects[right]?.name ?? right),
  );
  for (const projectKey of keys) {
    const now = current.projects[projectKey];
    const before = previous.projects[projectKey];
    if (now === undefined || before === undefined) {
      continue;
    }
    const projectName = now.name;
    const doneBefore = new Set(before.doneItems.map((item) => item.id));
    for (const item of now.doneItems) {
      if (!doneBefore.has(item.id)) {
        shipped.push({ kind: "item", projectKey, projectName, itemId: item.id, outcome: item.outcome });
      }
    }
    if (now.release !== null && now.release !== before.release) {
      shipped.push({ kind: "release", projectKey, projectName, version: now.release });
    }
    const openBefore = new Set(before.openEntries.map((entry) => entry.id));
    for (const entry of now.openEntries) {
      if (!openBefore.has(entry.id)) {
        waiting.push({ projectKey, projectName, entryId: entry.id, text: entry.text });
      }
    }
    if (now.brokenReasons.length > 0 && before.brokenReasons.length === 0) {
      broke.push({ projectKey, projectName, reasons: now.brokenReasons });
    }
  }
  return { shipped, waiting, broke };
}
