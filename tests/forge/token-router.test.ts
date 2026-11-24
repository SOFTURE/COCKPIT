import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createForgeClient, type ForgeClient } from "../../src/forge/client.ts";
import { checkRepositoryAccess } from "../../src/forge/permissions.ts";
import {
  createTokenRouter,
  findPathRepository,
} from "../../src/forge/token-router.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

interface Call {
  readonly token: string;
  readonly method: string;
  readonly path: string;
}

interface TokenForge {
  /** Repositories (`owner/name`) the token reads, by owner selection. */
  readonly reads: readonly string[];
  /** Repositories it may create issues in; defaults to `reads`. */
  readonly writes?: readonly string[];
  readonly remaining?: number;
}

function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/** A forge that answers each token only for its own repositories, and records which token made each call. */
function createForge(tokens: Readonly<Record<string, TokenForge>>) {
  const calls: Call[] = [];
  let issueNumber = 0;
  const clients = Object.keys(tokens).map((token) =>
    createForgeClient({
      token,
      baseUrl: TEST_FORGE_API,
      fetch: (input: string | URL | Request, init?: RequestInit) =>
        Promise.resolve(answer(token, input, init)),
    }),
  );

  function answer(
    token: string,
    input: string | URL | Request,
    init?: RequestInit,
  ): Response {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const path = url.slice(TEST_FORGE_API.length);
    calls.push({ token, method, path });
    const forge = tokens[token] as TokenForge;
    const budget: Record<string, string> =
      forge.remaining === undefined
        ? {}
        : {
            "x-ratelimit-remaining": String(forge.remaining),
            "x-ratelimit-reset": "1800000000",
          };
    if (path.startsWith("/user/repos")) {
      return json(
        200,
        forge.reads.map((fullName) => ({
          full_name: fullName,
          archived: false,
        })),
        budget,
      );
    }
    const match = /^\/repos\/([^/]+)\/([^/?]+)(.*)$/.exec(path);
    const fullName =
      match === null ? "" : `${match[1] ?? ""}/${match[2] ?? ""}`;
    const rest = match?.[3] ?? "";
    if (!forge.reads.includes(fullName)) {
      return json(404, { message: "Not Found" }, budget);
    }
    if (method === "POST" && rest === "/issues") {
      if (!(forge.writes ?? forge.reads).includes(fullName)) {
        return json(
          403,
          { message: "Resource not accessible by personal access token" },
          budget,
        );
      }
      issueNumber += 1;
      return json(
        201,
        {
          number: issueNumber,
          html_url: `https://forge.example.test/${fullName}/issues/${String(issueNumber)}`,
        },
        budget,
      );
    }
    if (rest === "") {
      return json(200, { full_name: fullName, default_branch: "main" }, budget);
    }
    return json(200, { path: rest }, budget);
  }
  return { calls, clients };
}

const ISSUE = {
  title: "Owner word: pick the mail provider",
  body: "yes",
  labels: ["owner-word"],
};

describe("findPathRepository", () => {
  it("names the repository a path belongs to, and none for other paths", () => {
    expect(
      findPathRepository(
        "/repos/example-org/alpha-app/actions/runs?per_page=1",
      ),
    ).toEqual({ owner: "example-org", name: "alpha-app" });
    expect(findPathRepository("/repos/example-org/alpha-app")).toEqual({
      owner: "example-org",
      name: "alpha-app",
    });
    expect(findPathRepository("/repos/example-org/alpha%2Eapp?x=1")).toEqual({
      owner: "example-org",
      name: "alpha.app",
    });
    expect(findPathRepository("/user/repos?per_page=100")).toBeNull();
  });
});

describe("createTokenRouter", () => {
  it("returns the one client itself when there is one token", () => {
    const { clients } = createForge({
      personal: { reads: ["example-dev/notes"] },
    });
    expect(createTokenRouter(clients)).toBe(clients[0]);
  });

  it("refuses to build without a client", () => {
    expect(() => createTokenRouter([])).toThrow(/at least one client/);
  });

  it("reads each owner's repository and creates its owner-word issue with that owner's token", async () => {
    const { calls, clients } = createForge({
      personal: { reads: ["example-dev/notes"] },
      team: { reads: ["example-team/rho-app"] },
    });
    const router = createTokenRouter(clients);

    for (const [owner, name] of [
      ["example-dev", "notes"],
      ["example-team", "rho-app"],
    ] as const) {
      expect(
        await router.getJsonFile(owner, name, "context/state.json", "main"),
      ).toMatchObject({ ok: true });
      expect(
        await router.getJson(
          `/repos/${owner}/${name}/actions/runs?per_page=1`,
          z.unknown(),
        ),
      ).toMatchObject({ ok: true });
      expect(
        await router.probe(`/repos/${owner}/${name}/pulls?per_page=1`),
      ).toEqual({ ok: true, value: undefined });
      expect(await router.hasLabel(owner, name, "owner-word")).toEqual({
        ok: true,
        value: true,
      });
      expect(await router.createIssue(owner, name, ISSUE)).toMatchObject({
        ok: true,
      });
    }

    const byToken = (token: string) =>
      calls.filter(
        (call) =>
          call.token === token &&
          !call.path.endsWith("/notes") &&
          !call.path.endsWith("/rho-app"),
      );
    expect(
      byToken("personal").every((call) =>
        call.path.startsWith("/repos/example-dev/notes"),
      ),
    ).toBe(true);
    expect(
      byToken("team").every((call) =>
        call.path.startsWith("/repos/example-team/rho-app"),
      ),
    ).toBe(true);
    expect(
      calls.filter((call) => call.method === "POST").map((call) => call.token),
    ).toEqual(["personal", "team"]);
  });

  it("picks the token once per repository for the router's lifetime", async () => {
    const { calls, clients } = createForge({
      personal: { reads: ["example-dev/notes"] },
      team: { reads: ["example-team/rho-app"] },
    });
    const router = createTokenRouter(clients);
    await Promise.all([
      router.listOwnerWordIssues("example-team", "rho-app"),
      router.hasLabel("example-team", "rho-app", "owner-word"),
    ]);
    await router.getRepository("Example-Team", "Rho-App");
    const metadataReads = calls.filter(
      (call) => call.path.toLowerCase() === "/repos/example-team/rho-app",
    );
    expect(metadataReads.map((call) => call.token)).toEqual([
      "personal",
      "team",
    ]);
  });

  it("does not take a missing label from a token that cannot see the repository", async () => {
    const { calls, clients } = createForge({
      personal: { reads: [] },
      team: { reads: ["example-team/rho-app"] },
    });
    expect(
      await createTokenRouter(clients).hasLabel(
        "example-team",
        "rho-app",
        "owner-word",
      ),
    ).toEqual({ ok: true, value: true });
    expect(
      calls
        .filter((call) => call.path.includes("/labels/"))
        .map((call) => call.token),
    ).toEqual(["team"]);
  });

  it("answers not_found when no token finds the repository, so Settings names the owner", async () => {
    const { clients } = createForge({
      personal: { reads: ["example-dev/notes"] },
      team: { reads: ["example-team/rho-app"] },
    });
    const router = createTokenRouter(clients);
    expect(await router.getRepository("example-other", "sigma-app")).toEqual({
      ok: false,
      kind: "not_found",
    });
    expect(
      await router.getJson(
        "/repos/example-other/sigma-app/releases/latest",
        z.unknown(),
      ),
    ).toEqual({ ok: false, kind: "not_found" });
    expect(
      await checkRepositoryAccess(router, {
        owner: "example-other",
        name: "sigma-app",
        fullName: "example-other/sigma-app",
        key: "example-other/sigma-app",
      }),
    ).toEqual({
      kind: "unreadable",
      reason: "not_found",
      missing: ["metadata"],
    });
  });

  it("writes to a public repository of another owner with that owner's token when the first is refused", async () => {
    const { calls, clients } = createForge({
      personal: {
        reads: ["example-dev/notes", "example-team/rho-app"],
        writes: ["example-dev/notes"],
      },
      team: { reads: ["example-team/rho-app"] },
    });
    const router = createTokenRouter(clients);
    expect(
      await router.createIssue("example-team", "rho-app", ISSUE),
    ).toMatchObject({ ok: true, value: { number: 1 } });
    expect(
      calls.filter((call) => call.method === "POST").map((call) => call.token),
    ).toEqual(["personal", "team"]);
  });

  it("does not retry a write the forge may have taken", async () => {
    const refusedEverywhere = createForge({
      personal: { reads: ["example-dev/notes"], writes: [] },
      team: { reads: [] },
    });
    expect(
      await createTokenRouter(refusedEverywhere.clients).createIssue(
        "example-dev",
        "notes",
        ISSUE,
      ),
    ).toMatchObject({ ok: false, kind: "refused" });

    const down: ForgeClient = {
      ...refusedEverywhere.clients[0]!,
      getRepository: () =>
        Promise.resolve({
          ok: true,
          value: { full_name: "example-dev/notes", default_branch: "main" },
        }),
      createIssue: () => Promise.resolve({ ok: false, kind: "unavailable" }),
    };
    const second = createForge({ team: { reads: ["example-dev/notes"] } });
    expect(
      await createTokenRouter([down, ...second.clients]).createIssue(
        "example-dev",
        "notes",
        ISSUE,
      ),
    ).toEqual({ ok: false, kind: "unavailable" });
    expect(second.calls.filter((call) => call.method === "POST")).toEqual([]);
  });

  it("reports the budget closest to running out", async () => {
    const { clients } = createForge({
      personal: { reads: ["example-dev/notes"], remaining: 4000 },
      team: { reads: ["example-team/rho-app"], remaining: 30 },
    });
    const router = createTokenRouter(clients);
    expect(router.getBudget()).toEqual({ remaining: null, resetAt: null });
    await router.getRepository("example-team", "rho-app");
    expect(router.getBudget()).toEqual({ remaining: 30, resetAt: 1800000000 });
  });

  it("sends paths that name no repository to the first token", async () => {
    const { calls, clients } = createForge({
      personal: { reads: [] },
      team: { reads: [] },
    });
    await createTokenRouter(clients).getJson(
      "/user/repos?per_page=100",
      z.unknown(),
    );
    expect(calls.map((call) => call.token)).toEqual(["personal"]);
  });
});
