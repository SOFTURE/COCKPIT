// One issue's state, read by its number whatever labels it carries (#166): how the scan learns that an answer's own
// issue was closed when the issue is not in the labelled cockpit list.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

const issueStateSchema = z.object({ state: z.enum(["open", "closed"]), closed_at: z.string().nullable() });

export interface IssueState {
  readonly state: "open" | "closed";
  readonly closedAt: string | null;
}

export async function readIssueState(client: ForgeClient, owner: string, name: string, issueNumber: number): Promise<ForgeRead<IssueState>> {
  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues/${String(issueNumber)}`;
  const answer = await client.getJson(path, issueStateSchema);
  return answer.ok ? { ok: true, value: { state: answer.value.state, closedAt: answer.value.closed_at } } : answer;
}
