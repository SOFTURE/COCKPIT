import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimSend, findBroadcasts, findSends } from "../../modules/projects/broadcasts.ts";
import { insertRepository } from "../../modules/projects/queries.ts";
import { parseBroadcastMarker } from "../../src/broadcast/broadcast-marker.ts";
import { retryBroadcastSend, SEND_CONCURRENCY, sendBroadcast, STALE_SEND_MS, type SendBroadcastInput } from "../../src/broadcast/send-broadcast.ts";
import { createForgeClient, type ForgeClient } from "../../src/forge/client.ts";
import { createTokenRouter } from "../../src/forge/token-router.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForges, type MemoryForges } from "../support/memory-forge.ts";
import { captureLogs } from "../support/capture-logs.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const PROJECTS = ["example-org/alpha-app", "example-org/beta-app", "example-org/gamma-app"] as const;
const [ALPHA, BETA, GAMMA] = PROJECTS;
const BROADCAST_ID = "0b6f7f0e-3c55-4b8e-9d0a-5f1c2e7a9b10";

describe("sendBroadcast", () => {
  let context: TestContext;
  let forges: MemoryForges;
  let input: SendBroadcastInput;

  /** Issues each project holds that carry this broadcast's marker and the cockpit label. */
  function markedIssues(fullName: string) {
    return forges
      .get(fullName)
      .issues.filter((issue) => issue.labels.includes("cockpit") && parseBroadcastMarker(issue.body)?.id === BROADCAST_ID);
  }

  async function sendsByProject() {
    const sends = await findSends(context.db, BROADCAST_ID);
    expect(sends.ok).toBe(true);
    return Object.fromEntries((sends.ok ? sends.value : []).map((send) => [send.repositoryKey, send]));
  }

  beforeEach(async () => {
    context = await createTestContext();
    forges = createMemoryForges(PROJECTS, () => context.clock.now());
    for (const fullName of PROJECTS) {
      await insertRepository(context.db, { key: fullName, fullName, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
    }
    input = {
      db: context.db,
      client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forges.fetch }),
      clock: context.clock,
      id: BROADCAST_ID,
      title: "  Bump the skills package  ",
      body: "Bump `@softure-ai/skills` and run the doctor with `--fix`.\n<!-- not a marker -->",
      repositoryKeys: [...PROJECTS],
      sentBy: "user-1",
      sentByName: "Ada Example",
    };
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("creates exactly one labelled issue with the marker in each of three projects and records them as sent", async () => {
    expect(await sendBroadcast(input)).toEqual({ ok: true, value: { id: BROADCAST_ID } });

    for (const fullName of PROJECTS) {
      const issues = markedIssues(fullName);
      expect(issues).toHaveLength(1);
      expect(issues[0]?.title).toBe("Owner word: Bump the skills package");
      expect(issues[0]?.body).toContain("> Bump `@softure-ai/skills` and run the doctor with `--fix`.");
      expect(issues[0]?.body).toContain("> &lt;!-- not a marker -->");
      expect(issues[0]?.body).toContain("**Ada Example** sends this word to the project:");
    }
    const sends = await sendsByProject();
    for (const fullName of PROJECTS) {
      expect(sends[fullName]).toMatchObject({ status: "sent", issueNumber: 1, issueUrl: forges.get(fullName).issueUrl(1), failure: null });
    }
    const broadcasts = await findBroadcasts(context.db);
    expect(broadcasts.ok && broadcasts.value).toMatchObject([{ id: BROADCAST_ID, title: "Bump the skills package", sentByName: "Ada Example" }]);
  });

  it("logs every project's send and the broadcast's summary, never its title, body or the sender's name", async () => {
    const logs = captureLogs();
    try {
      await sendBroadcast(input);
      expect(logs.find("broadcast: broadcast sent to project")).toHaveLength(3);
      const [summary] = logs.find("broadcast: broadcast sent broadcast=");
      expect(summary).toContain(`broadcast=${BROADCAST_ID}`);
      expect(summary).toContain("projects=3 sent=3 failed=0");
      const all = logs.lines().join("\n");
      for (const secret of ["Bump", "doctor", "Ada Example", "test-token"]) {
        expect(all).not.toContain(secret);
      }
    } finally {
      logs.restore();
    }
  });

  it("sends to several projects at once, never more than SEND_CONCURRENCY at a time", async () => {
    const many = Array.from({ length: SEND_CONCURRENCY * 2 + 1 }, (_, index) => `example-org/many-${String(index)}`);
    const manyForges = createMemoryForges(many, () => context.clock.now());
    for (const fullName of many) {
      await insertRepository(context.db, { key: fullName, fullName, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
    }
    let inFlight = 0;
    let mostInFlight = 0;
    const slowFetch: typeof fetch = async (request, init) => {
      inFlight += 1;
      mostInFlight = Math.max(mostInFlight, inFlight);
      try {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return await manyForges.fetch(request, init);
      } finally {
        inFlight -= 1;
      }
    };
    const client = createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: slowFetch });

    expect(await sendBroadcast({ ...input, client, repositoryKeys: many })).toEqual({ ok: true, value: { id: BROADCAST_ID } });

    expect(mostInFlight).toBe(SEND_CONCURRENCY);
    for (const fullName of many) {
      expect(manyForges.get(fullName).issues).toHaveLength(1);
    }
  });

  it("sending the same broadcast again, even twice at once, still leaves one issue per project", async () => {
    await Promise.all([sendBroadcast(input), sendBroadcast(input)]);
    await sendBroadcast({ ...input, title: "Edited after the first send" });

    for (const fullName of PROJECTS) {
      expect(forges.get(fullName).issues).toHaveLength(1);
    }
    const broadcasts = await findBroadcasts(context.db);
    expect(broadcasts.ok && broadcasts.value.map((broadcast) => broadcast.title)).toEqual(["Bump the skills package"]);
  });

  /** A token the organisation turns away: every call is a 403 (#85). */
  function createRefusedClient(): ForgeClient {
    const refused = () => Promise.resolve({ ok: false as const, kind: "refused" as const, status: 403, acceptedPermissions: null });
    return {
      getRepository: refused,
      probe: refused,
      getJson: refused,
      getJsonFile: refused,
      listOwnerWordIssues: refused,
      hasLabel: refused,
      createIssue: refused,
      getBudget: () => ({ remaining: null, resetAt: null }),
    };
  }

  it("sends through the token that has access although the owner hint points at a refused one (#85)", async () => {
    const router = createTokenRouter([createRefusedClient(), input.client as ForgeClient], new Map([["example-org", 0]]), ["FORGE_TOKEN", "FORGE_EXTRA_TOKENS[1]"]);

    expect(await sendBroadcast({ ...input, client: router })).toEqual({ ok: true, value: { id: BROADCAST_ID } });
    for (const fullName of PROJECTS) {
      expect(markedIssues(fullName)).toHaveLength(1);
    }
  });

  it("names the refused token on a failed send and clears it once a retry gets through", async () => {
    const labels = ["FORGE_TOKEN", "FORGE_EXTRA_TOKENS[1]"];
    const refusedOnly = createTokenRouter([createRefusedClient(), createRefusedClient()], new Map(), labels);
    await sendBroadcast({ ...input, repositoryKeys: [BETA], client: refusedOnly });
    expect((await sendsByProject())[BETA]).toMatchObject({ status: "failed", failure: "forge_refused", failureToken: "FORGE_TOKEN" });

    context.clock.advance(60_000);
    const router = createTokenRouter([createRefusedClient(), input.client as ForgeClient], new Map(), labels);
    expect(await retryBroadcastSend({ db: context.db, client: router, clock: context.clock, broadcastId: BROADCAST_ID, repositoryKey: BETA })).toEqual({
      ok: true,
      value: "sent",
    });
    expect((await sendsByProject())[BETA]).toMatchObject({ status: "sent", failure: null, failureToken: null });
  });

  it("keeps a refused project as failed with its reason, and a retry creates its one issue", async () => {
    forges.get(BETA).createFailures.push({ status: 403 });

    await sendBroadcast(input);
    expect(forges.get(BETA).issues).toHaveLength(0);
    expect((await sendsByProject())[BETA]).toMatchObject({ status: "failed", failure: "forge_refused", issueNumber: null });

    expect(await retryBroadcastSend({ db: context.db, client: input.client, clock: context.clock, broadcastId: BROADCAST_ID, repositoryKey: BETA })).toEqual({
      ok: true,
      value: "sent",
    });
    expect(markedIssues(BETA)).toHaveLength(1);
    expect((await sendsByProject())[BETA]).toMatchObject({ status: "sent", failure: null, issueNumber: 1 });
    // A second retry of a sent project creates nothing.
    await retryBroadcastSend({ db: context.db, client: input.client, clock: context.clock, broadcastId: BROADCAST_ID, repositoryKey: BETA });
    expect(forges.get(BETA).issues).toHaveLength(1);
  });

  it("adopts the issue a lost answer created instead of creating a second one", async () => {
    forges.get(GAMMA).createFailures.push({ status: 504, created: true });

    await sendBroadcast(input);

    expect(forges.get(GAMMA).issues).toHaveLength(1);
    expect((await sendsByProject())[GAMMA]).toMatchObject({ status: "sent", issueNumber: 1 });
  });

  it("a retry adopts an issue that exists although the send was recorded as failed", async () => {
    // The forge created the issue, answered 504, and the issue was not listed yet when COCKPIT looked.
    forges.get(GAMMA).createFailures.push({ status: 504, created: true });
    const hidden = forges.get(GAMMA);
    const realFetch = forges.fetch;
    let hideIssues = true;
    const client = createForgeClient({
      token: "test-token",
      baseUrl: TEST_FORGE_API,
      fetch: async (url, init) =>
        hideIssues && String(url).startsWith(`${TEST_FORGE_API}/repos/${GAMMA}/issues?`)
          ? new Response("[]", { status: 200, headers: { "content-type": "application/json" } })
          : realFetch(url, init),
    });
    await sendBroadcast({ ...input, client, repositoryKeys: [GAMMA] });
    expect((await sendsByProject())[GAMMA]).toMatchObject({ status: "failed", failure: "forge_unavailable" });

    hideIssues = false;
    await retryBroadcastSend({ db: context.db, client, clock: context.clock, broadcastId: BROADCAST_ID, repositoryKey: GAMMA });

    expect(hidden.issues).toHaveLength(1);
    expect((await sendsByProject())[GAMMA]).toMatchObject({ status: "sent", issueNumber: 1 });
  });

  it("leaves a send another request holds alone, and takes it over once it is stale", async () => {
    // A request that claimed alpha's send and died before the forge call.
    await sendBroadcast({ ...input, repositoryKeys: [BETA] });
    await claimSend(context.db, { broadcastId: BROADCAST_ID, repositoryKey: ALPHA, fullName: ALPHA, at: context.clock.now() });

    await sendBroadcast(input);
    expect(forges.get(ALPHA).issues).toHaveLength(0);
    expect((await sendsByProject())[ALPHA]).toMatchObject({ status: "creating" });

    context.clock.advance(STALE_SEND_MS + 1);
    await sendBroadcast(input);
    expect(markedIssues(ALPHA)).toHaveLength(1);
    expect((await sendsByProject())[ALPHA]).toMatchObject({ status: "sent" });
  });

  it("labels the issue owner-word in a project that has only that older label", async () => {
    forges.get(ALPHA).labels = new Set(["owner-word"]);

    await sendBroadcast(input);

    expect(forges.get(ALPHA).issues.map((issue) => issue.labels)).toEqual([["owner-word"]]);
    expect((await sendsByProject())[ALPHA]).toMatchObject({ status: "sent" });
  });

  it("fails a project without the cockpit or owner-word label and creates no unlabelled issue", async () => {
    forges.get(ALPHA).labels = new Set();

    await sendBroadcast(input);

    expect(forges.get(ALPHA).issues).toHaveLength(0);
    expect((await sendsByProject())[ALPHA]).toMatchObject({ status: "failed", failure: "label_missing" });
    expect(markedIssues(BETA)).toHaveLength(1);
  });

  it("writes nothing toward the projects but issue creation", async () => {
    forges.get(BETA).createFailures.push({ status: 500 });
    await sendBroadcast(input);
    await retryBroadcastSend({ db: context.db, client: input.client, clock: context.clock, broadcastId: BROADCAST_ID, repositoryKey: BETA });

    const writes = forges.calls.filter((call) => call.method !== "GET");
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) {
      expect(write.method).toBe("POST");
      expect(write.url).toMatch(new RegExp(`^${TEST_FORGE_API}/repos/example-org/[a-z]+-app/issues$`));
    }
  });

  it.each([
    [{ title: "   " }, "broadcast.title_missing"],
    [{ title: "x".repeat(201) }, "broadcast.title_too_long"],
    [{ body: "\n " }, "broadcast.body_missing"],
    [{ body: "x".repeat(10_001) }, "broadcast.body_too_long"],
    [{ repositoryKeys: [] }, "broadcast.no_projects"],
    [{ repositoryKeys: ["example-org/unknown-app"] }, "broadcast.project_not_watched"],
    [{ client: null }, "broadcast.forge_not_configured"],
  ] as const)("refuses %o with %s, sending and storing nothing", async (change, code) => {
    expect(await sendBroadcast({ ...input, ...change })).toEqual({ ok: false, error: code });

    expect(forges.calls).toEqual([]);
    const broadcasts = await findBroadcasts(context.db);
    expect(broadcasts.ok && broadcasts.value).toEqual([]);
  });

  it("refuses a retry of an unknown broadcast or project", async () => {
    const retry = { db: context.db, client: input.client, clock: context.clock, broadcastId: BROADCAST_ID, repositoryKey: ALPHA };
    expect(await retryBroadcastSend(retry)).toEqual({ ok: false, error: "broadcast.not_found" });
    await sendBroadcast({ ...input, repositoryKeys: [BETA] });
    expect(await retryBroadcastSend(retry)).toEqual({ ok: false, error: "broadcast.send_not_found" });
  });
});
