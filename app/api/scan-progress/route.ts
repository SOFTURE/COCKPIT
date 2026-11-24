// How far the scan of every watched project is, for the header's refresh to follow live. Signed-in users only.
import { getCurrentUser } from "@softure-ai/auth/next";
import { loadScanProgress } from "../../../src/scan/load-scan-progress.ts";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: "auth.unauthorized" }, { status: 401 });
  }
  return Response.json(await loadScanProgress(), { headers: { "cache-control": "no-store" } });
}
