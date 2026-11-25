// The label of the issues COCKPIT creates in a watched project (FR-5, CV-1): `cockpit`. Projects on
// `@softure-ai/skills` before 0.39 know only the older `owner-word`, so a project that has only that label keeps
// getting it, and issues of both labels are read. COCKPIT never creates a label (NFR-7).
import type { ForgeClient, ForgeRead } from "./client.ts";

export const ISSUE_LABEL = "cockpit";
export const LEGACY_ISSUE_LABEL = "owner-word";
/** Every label an owner-word issue may carry, the one to prefer first. */
export const ISSUE_LABELS = [ISSUE_LABEL, LEGACY_ISSUE_LABEL] as const;
export type IssueLabel = (typeof ISSUE_LABELS)[number];

/** The label to create an issue with: the first of `ISSUE_LABELS` the repository has, null when it has none. */
export async function findIssueLabel(client: ForgeClient, owner: string, name: string): Promise<ForgeRead<IssueLabel | null>> {
  for (const label of ISSUE_LABELS) {
    const found = await client.hasLabel(owner, name, label);
    if (!found.ok) {
      return found;
    }
    if (found.value) {
      return { ok: true, value: label };
    }
  }
  return { ok: true, value: null };
}
