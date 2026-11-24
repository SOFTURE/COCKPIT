import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimAnswer, findAnswers } from "../../modules/projects/answers.ts";
import { insertRepository } from "../../modules/projects/queries.ts";
import { recordRead } from "../../modules/projects/reads.ts";
import { answerEntry, STALE_CLAIM_MS, type AnswerEntryInput } from "../../src/decisions/answer-entry.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { parseOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";
import type { OwnerQueueEntry } from "../../src/state/state-schema.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForge, type MemoryForge } from "../support/memory-forge.ts";
import { createStateFixture } from "../support/state-fixture.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const FULL_NAME = "example-org/alpha-app";
const ENTRY: OwnerQueueEntry = {
  id: "oq-alpha-1",
  kind: "decision",
  source: "context/foundation/roadmap.md",
  item: "AL-2",
  since: "2026-10-30",
  text: "Pick the mail provider",
};

async function storeEntries(context: TestContext, entries: OwnerQueueEntry[]) {
  const recorded = await recordRead(context.db, {
    key: FULL_NAME,
    status: "ok",
    issuesStatus: "ok",
    state: createStateFixture({ owner_queue: entries }),
    issues: [],
    readAt: context.clock.now(),
  });
  expect(recorded.ok).toBe(true);
}

describe("answerEntry", () => {
  let context: TestContext;
  let forge: MemoryForge;
  let input: AnswerEntryInput;

  beforeEach(async () => {
    context = await createTestContext();
    forge = createMemoryForge(FULL_NAME, () => context.clock.now());
    await insertRepository(context.db, {
      key: FULL_NAME,
      fullName: FULL_NAME,
      defaultBranch: "main",
      hasState: true,
      missingPermissions: [],
      checkedAt: TEST_START,
    });
    await storeEntries(context, [ENTRY]);
    input = {
      db: context.db,
      client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch }),
      clock: context.clock,
      userId: "user-1",
      answeredByName: "Ada Example",
      repositoryKey: FULL_NAME,
      entryId: ENTRY.id,
      entryText: ENTRY.text,
      answer: "yes",
      note: "  Go with the cheaper one.  ",
    };
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("creates one owner-word issue quoting the entry, the answer and the note, with the marker, and records it as sent", async () => {
    const result = await answerEntry(input);

    expect(result).toEqual({ ok: true, value: { answer: "yes", issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyAnswered: false } });
    expect(forge.issues).toHaveLength(1);
    const [issue] = forge.issues;
    expect(issue?.labels).toEqual(["owner-word"]);
    expect(issue?.title).toBe("Owner word: Yes, Pick the mail provider");
    expect(issue?.body).toContain("> Pick the mail provider");
    expect(issue?.body).toContain("- Source: `context/foundation/roadmap.md`");
    expect(issue?.body).toContain("- Item: AL-2");
    expect(issue?.body).toContain("> Go with the cheaper one.");
    expect(issue?.body).toContain("**Ada Example** answers **Yes**");
    expect(issue?.body).toContain("Note from Ada Example:");
    expect(parseOwnerWordMarker(issue?.body ?? "")).toEqual({ entry: "oq-alpha-1", answer: "yes" });
    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value).toMatchObject([
      { entryId: "oq-alpha-1", entryText: "Pick the mail provider", answer: "yes", note: "Go with the cheaper one.", answeredBy: "user-1", answeredByName: "Ada Example", status: "sent", issueNumber: 1 },
    ]);
  });

  it("answers a routine owner step Done: one owner-word issue with the marker's yes and the confirmed step, recorded with its kind", async () => {
    const step: OwnerQueueEntry = {
      id: "oq-alpha-r1",
      kind: "secret",
      source: "context/workflow.json#routines.packageUpdates.ownerSteps",
      item: null,
      since: "2026-11-24",
      text: "@example/mail 0.3.0: set the production secret MAIL_KEY_SECRET (#42)",
    };
    await storeEntries(context, [ENTRY, step]);

    const result = await answerEntry({ ...input, entryId: step.id, entryText: step.text, note: null });

    expect(result.ok && result.value.issueNumber).toBe(1);
    expect(forge.issues).toHaveLength(1);
    const [issue] = forge.issues;
    expect(issue?.labels).toEqual(["owner-word"]);
    expect(issue?.title).toBe(`Owner word: Done, ${step.text}`);
    expect(issue?.body).toContain("**Ada Example** answers **Done**");
    expect(issue?.body).toContain('set `"confirmed": "#<this issue>"` on that `ownerSteps` entry');
    expect(parseOwnerWordMarker(issue?.body ?? "")).toEqual({ entry: "oq-alpha-r1", answer: "yes" });
    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value).toMatchObject([{ entryId: "oq-alpha-r1", entryKind: "secret", answer: "yes", status: "sent" }]);
  });

  it("creates exactly one issue when the same entry is answered twice at once", async () => {
    const [first, second] = await Promise.all([answerEntry(input), answerEntry({ ...input, answer: "no" })]);

    expect(forge.issues).toHaveLength(1);
    const outcomes = [first, second].map((result) => (result.ok ? "sent" : result.error));
    expect(outcomes).toContain("sent");
    expect(outcomes.filter((outcome) => outcome === "sent").length + outcomes.filter((outcome) => outcome === "decisions.answer_in_progress").length).toBe(2);
    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value.length).toBe(1);
  });

  it("returns the existing answer and creates nothing when the entry was answered already", async () => {
    await answerEntry(input);
    const again = await answerEntry({ ...input, answer: "later" });

    expect(again).toEqual({ ok: true, value: { answer: "yes", issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyAnswered: true } });
    expect(forge.issues).toHaveLength(1);
  });

  it("refuses without the owner-word label, creates no issue and records nothing", async () => {
    forge.labels = new Set();

    expect(await answerEntry(input)).toEqual({ ok: false, error: "decisions.label_missing" });
    expect(forge.calls.filter((call) => call.method !== "GET")).toEqual([]);
    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value).toEqual([]);
  });

  it.each([
    [403, "decisions.forge_refused"],
    [401, "decisions.forge_unauthorized"],
    [422, "decisions.forge_refused"],
    [503, "decisions.forge_unavailable"],
  ] as const)("leaves the entry unanswered with the reason when the forge answers %i", async (status, code) => {
    forge.createFailures.push({ status });

    expect(await answerEntry(input)).toEqual({ ok: false, error: code });
    expect(forge.issues).toEqual([]);
    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value).toEqual([]);

    // Once the forge is back, the same entry can be answered.
    expect((await answerEntry(input)).ok).toBe(true);
    expect(forge.issues).toHaveLength(1);
  });

  it("adopts the issue a lost answer created instead of dropping the answer", async () => {
    forge.createFailures.push({ status: 504, created: true });

    const result = await answerEntry(input);

    expect(result).toEqual({ ok: true, value: { answer: "yes", issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyAnswered: false } });
    expect(forge.issues).toHaveLength(1);
  });

  it("takes over a claim left by a request that died, adopting the issue it had created", async () => {
    const claim = await claimAnswer(context.db, {
      repositoryKey: FULL_NAME,
      fullName: FULL_NAME,
      entryId: ENTRY.id,
      entryText: ENTRY.text,
      entryKind: ENTRY.kind,
      entrySource: ENTRY.source,
      entryItem: ENTRY.item,
      answer: "no",
      note: null,
      answeredBy: "user-1",
      answeredByName: "Ada Example",
      answeredAt: context.clock.now(),
    });
    expect(claim.ok && claim.value.kind).toBe("claimed");
    expect(await answerEntry(input)).toEqual({ ok: false, error: "decisions.answer_in_progress" });

    // The dead request had created its issue before it could record it.
    forge.issues.push({ number: 1, title: "Owner word", body: '<!-- owner-word: {"entry":"oq-alpha-1","answer":"no"} -->', labels: ["owner-word"], state: "open", createdAt: context.clock.now().toISOString() });
    context.clock.advance(STALE_CLAIM_MS + 1);

    expect(await answerEntry(input)).toEqual({ ok: true, value: { answer: "no", issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyAnswered: true } });
    expect(forge.issues).toHaveLength(1);
    // The recorded answer is the one the adopted issue carries, not the later request's.
    const stored = await findAnswers(context.db);
    expect(stored.ok && stored.value.map((row) => [row.answer, row.status, row.issueNumber])).toEqual([["no", "sent", 1]]);
  });

  it("takes over a stale claim with no issue behind it and creates the issue", async () => {
    await claimAnswer(context.db, {
      repositoryKey: FULL_NAME,
      fullName: FULL_NAME,
      entryId: ENTRY.id,
      entryText: ENTRY.text,
      entryKind: ENTRY.kind,
      entrySource: ENTRY.source,
      entryItem: ENTRY.item,
      answer: "no",
      note: null,
      answeredBy: "user-1",
      answeredByName: "Ada Example",
      answeredAt: context.clock.now(),
    });
    context.clock.advance(STALE_CLAIM_MS + 1);

    expect(await answerEntry(input)).toEqual({ ok: true, value: { answer: "yes", issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyAnswered: false } });
  });

  it("refuses an entry the project no longer lists, or whose text changed since it was shown", async () => {
    expect(await answerEntry({ ...input, entryId: "oq-unknown" })).toEqual({ ok: false, error: "decisions.entry_gone" });
    expect(await answerEntry({ ...input, entryText: "Pick a mail provider" })).toEqual({ ok: false, error: "decisions.entry_changed" });
    expect(await answerEntry({ ...input, repositoryKey: "example-org/unknown-app" })).toEqual({ ok: false, error: "decisions.project_not_watched" });
    expect(forge.calls).toEqual([]);
  });

  it("answers a reworded entry again: same id, new text, a new issue", async () => {
    await answerEntry(input);
    await storeEntries(context, [{ ...ENTRY, text: "Pick the mail provider before the release" }]);

    const result = await answerEntry({ ...input, entryText: "Pick the mail provider before the release", answer: "later" });

    expect(result).toEqual({ ok: true, value: { answer: "later", issueNumber: 2, issueUrl: forge.issueUrl(2), alreadyAnswered: false } });
    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value.map((answer) => answer.entryText)).toEqual(["Pick the mail provider", "Pick the mail provider before the release"]);
  });

  it("refuses a note over the limit and a missing forge token before touching anything", async () => {
    expect(await answerEntry({ ...input, note: "x".repeat(2001) })).toEqual({ ok: false, error: "decisions.note_too_long" });
    expect(await answerEntry({ ...input, client: null })).toEqual({ ok: false, error: "decisions.forge_not_configured" });
    expect(forge.calls).toEqual([]);
  });
});

describe("answerEntry with the same entry in two projects (F-8)", () => {
  const BETA = "example-org/beta-app";
  let context: TestContext;
  let alphaForge: MemoryForge;
  let betaForge: MemoryForge;

  beforeEach(async () => {
    context = await createTestContext();
    alphaForge = createMemoryForge(FULL_NAME, () => context.clock.now());
    betaForge = createMemoryForge(BETA, () => context.clock.now());
    for (const key of [FULL_NAME, BETA]) {
      await insertRepository(context.db, { key, fullName: key, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
      const recorded = await recordRead(context.db, {
        key,
        status: "ok",
        issuesStatus: "ok",
        state: createStateFixture({ owner_queue: [ENTRY] }),
        issues: [],
        readAt: context.clock.now(),
      });
      expect(recorded.ok).toBe(true);
    }
  });

  afterEach(async () => {
    await context.database.close();
  });

  function answerIn(repositoryKey: string, forge: MemoryForge, answer: AnswerEntryInput["answer"]) {
    return answerEntry({
      db: context.db,
      client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch }),
      clock: context.clock,
      userId: "user-1",
      answeredByName: "Ada Example",
      repositoryKey,
      entryId: ENTRY.id,
      entryText: ENTRY.text,
      answer,
      note: null,
    });
  }

  it("answers one project's entry without answering the other's, then answers the other with its own issue", async () => {
    const beta = await answerIn(BETA, betaForge, "later");
    expect(beta).toEqual({ ok: true, value: { answer: "later", issueNumber: 1, issueUrl: betaForge.issueUrl(1), alreadyAnswered: false } });
    expect(alphaForge.issues).toEqual([]);

    const alpha = await answerIn(FULL_NAME, alphaForge, "yes");
    expect(alpha).toEqual({ ok: true, value: { answer: "yes", issueNumber: 1, issueUrl: alphaForge.issueUrl(1), alreadyAnswered: false } });
    expect(betaForge.issues).toHaveLength(1);

    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value.map((row) => [row.repositoryKey, row.entryId, row.answer, row.status])).toEqual([
      [BETA, ENTRY.id, "later", "sent"],
      [FULL_NAME, ENTRY.id, "yes", "sent"],
    ]);
  });
});

