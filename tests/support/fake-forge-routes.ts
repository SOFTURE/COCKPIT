// Scripted forge answers for one fictional repository's scan reads (state file and owner-word issues).
import type { FakeFetchRoute } from "@softure-ai/testing";

export const TEST_FORGE_API = "https://forge.example.test";

export interface ScanAnswer {
  readonly status?: number;
  readonly json: unknown;
  readonly headers?: Readonly<Record<string, string>>;
}

export function scanRoutes(
  fullName: string,
  answers: { readonly state?: ScanAnswer; readonly issues?: ScanAnswer },
  branch = "main",
): FakeFetchRoute[] {
  const base = `${TEST_FORGE_API}/repos/${fullName}`;
  const routes: FakeFetchRoute[] = [];
  if (answers.state !== undefined) {
    routes.push({ method: "GET", url: `${base}/contents/context/state.json?ref=${branch}`, ...answers.state });
  }
  if (answers.issues !== undefined) {
    routes.push({ method: "GET", url: `${base}/issues?labels=owner-word&state=all&per_page=100`, ...answers.issues });
  }
  return routes;
}
