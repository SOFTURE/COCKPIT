// The label of the issues COCKPIT creates in a watched project (FR-5, CV-1): `cockpit`, the only one written and read.
// COCKPIT never creates a label (NFR-7): a repository without it gets no issue.
import type { ForgeClient, ForgeRead } from "./client.ts";

export const ISSUE_LABEL = "cockpit";

/** Whether the repository has the `cockpit` label. */
export function hasIssueLabel(client: ForgeClient, owner: string, name: string): Promise<ForgeRead<boolean>> {
  return client.hasLabel(owner, name, ISSUE_LABEL);
}
