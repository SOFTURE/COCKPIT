import { fakeFetch, type FakeFetchRoute } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { checkRepositoryAccess, parseAcceptedPermissions } from "../../src/forge/permissions.ts";
import { parseRepositoryName } from "../../src/forge/repository-name.ts";

const API = "https://forge.example.test";
const REPO = "/repos/example-org/alpha";

function repositoryName() {
  const parsed = parseRepositoryName("example-org/alpha");
  if (!parsed.ok) {
    throw new Error("fixture name must parse");
  }
  return parsed.value;
}

interface Answer {
  readonly status?: number;
  readonly json: unknown;
  readonly headers?: Readonly<Record<string, string>>;
}

function routes(overrides: Partial<Record<"repo" | "state" | "pulls" | "issues" | "actions", Answer>>) {
  const answer = (key: keyof typeof overrides, url: string, fallback: Answer): FakeFetchRoute => ({
    method: "GET",
    url,
    ...(overrides[key] ?? fallback),
  });
  return [
    answer("repo", `${API}${REPO}`, { json: { full_name: "example-org/alpha", default_branch: "main" } }),
    answer("state", `${API}${REPO}/contents/context/state.json?ref=main`, { json: { type: "file" } }),
    answer("pulls", `${API}${REPO}/pulls?per_page=1`, { json: [] }),
    answer("issues", `${API}${REPO}/issues?per_page=1`, { json: [] }),
    answer("actions", `${API}${REPO}/actions/runs?per_page=1`, { json: { workflow_runs: [] } }),
  ];
}

async function check(overrides: Parameters<typeof routes>[0]) {
  const forge = fakeFetch(routes(overrides));
  const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
  return { access: await checkRepositoryAccess(client, repositoryName()), forge };
}

describe("checkRepositoryAccess", () => {
  it("reports a repository with every read permission and a state file as readable", async () => {
    const { access, forge } = await check({});
    expect(access).toEqual({ kind: "readable", fullName: "example-org/alpha", defaultBranch: "main", hasState: true, missing: [] });
    expect(forge.calls.every((call) => call.method === "GET")).toBe(true);
  });

  it("reports a repository without context/state.json as readable with no state", async () => {
    const { access } = await check({ state: { status: 404, json: { message: "Not Found" } } });
    expect(access).toMatchObject({ kind: "readable", hasState: false, missing: [] });
  });

  it("names Metadata when the repository is outside the token's selection", async () => {
    const { access, forge } = await check({ repo: { status: 404, json: { message: "Not Found" } } });
    expect(access).toEqual({ kind: "unreadable", reason: "not_found", missing: ["metadata"] });
    expect(forge.calls).toHaveLength(1);
  });

  it("names the permission from the forge's header when Contents is refused", async () => {
    const { access } = await check({
      state: { status: 403, json: { message: "Resource not accessible" }, headers: { "x-accepted-github-permissions": "contents=read" } },
    });
    expect(access).toEqual({ kind: "unreadable", reason: "refused", missing: ["contents"] });
  });

  it("keeps a readable repository and names a refused read without the header by its probe", async () => {
    const { access } = await check({ actions: { status: 403, json: { message: "Resource not accessible" } } });
    expect(access).toEqual({ kind: "readable", fullName: "example-org/alpha", defaultBranch: "main", hasState: true, missing: ["actions"] });
  });

  it("reports a refused token without naming a permission", async () => {
    const { access } = await check({ repo: { status: 401, json: { message: "Bad credentials" } } });
    expect(access).toEqual({ kind: "unreadable", reason: "unauthorized", missing: [] });
  });

  it("reports an unavailable forge", async () => {
    const { access } = await check({ repo: { status: 503, json: { message: "Unavailable" } } });
    expect(access).toEqual({ kind: "unreadable", reason: "unavailable", missing: [] });
  });
});

describe("parseAcceptedPermissions", () => {
  it("reads known keys in order and drops unknown ones", () => {
    expect(parseAcceptedPermissions("pull_requests=read; contents=read, secrets=read")).toEqual(["pull_requests", "contents"]);
  });

  it("answers no permission for a missing header", () => {
    expect(parseAcceptedPermissions(null)).toEqual([]);
  });
});
