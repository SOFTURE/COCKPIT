// The latest published release of a repository (GitHub's `releases/latest`); a repository without one answers 404,
// which is "no release", not a failure.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

const latestReleaseSchema = z.object({ tag_name: z.string(), published_at: z.string().nullable() });

export interface ForgeRelease {
  readonly version: string;
  /** `YYYY-MM-DD` of publication; null for a release the forge gave no date. */
  readonly date: string | null;
}

export async function getLatestRelease(client: ForgeClient, owner: string, name: string): Promise<ForgeRead<ForgeRelease | null>> {
  const answer = await client.getJson(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases/latest`,
    latestReleaseSchema,
  );
  if (!answer.ok) {
    return answer.kind === "not_found" ? { ok: true, value: null } : answer;
  }
  if (answer.value.tag_name === "") {
    return { ok: true, value: null };
  }
  return { ok: true, value: { version: answer.value.tag_name, date: answer.value.published_at?.slice(0, 10) ?? null } };
}
