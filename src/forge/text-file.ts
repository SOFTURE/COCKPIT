// A text file of a repository at a ref, through the contents API's JSON answer (base64, files up to 1 MB). Read-only.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

const contentsSchema = z.object({ type: z.literal("file"), encoding: z.literal("base64"), content: z.string() });

export interface TextFileQuery {
  readonly owner: string;
  readonly name: string;
  readonly path: string;
  readonly ref: string;
}

export async function getTextFile(client: ForgeClient, { owner, name, path, ref }: TextFileQuery): Promise<ForgeRead<string>> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const answer = await client.getJson(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
    contentsSchema,
  );
  if (!answer.ok) {
    return answer;
  }
  return { ok: true, value: Buffer.from(answer.value.content.replaceAll("\n", ""), "base64").toString("utf8") };
}
