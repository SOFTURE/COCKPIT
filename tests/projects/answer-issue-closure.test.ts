import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  claimAnswer,
  findAnswers,
  findAnswersAwaitingClosure,
  markAnswerSent,
  recordAnswerIssueClosed,
  type NewAnswer,
} from "../../modules/projects/answers.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";

const KEY = "example-org/alpha-app";

function answerTo(entryId: string, repositoryKey = KEY): NewAnswer {
  return {
    repositoryKey,
    fullName: repositoryKey,
    entryId,
    entryText: `Entry ${entryId}`,
    entryKind: "decision",
    entrySource: "context/foundation/roadmap.md",
    entryItem: null,
    answer: "yes",
    note: null,
    answeredBy: "owner",
    answeredByName: null,
    answeredAt: new Date("2026-11-02T09:00:00Z"),
  };
}

async function claim(context: TestContext, answer: NewAnswer): Promise<number> {
  const claimed = await claimAnswer(context.db, answer);
  if (!claimed.ok || claimed.value.kind !== "claimed") {
    throw new Error("the answer must be claimed");
  }
  return claimed.value.id;
}

describe("an answer's issue closure (#166)", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("lists only the project's sent answers not yet closed, and keeps the first closure", async () => {
    const sent = await claim(context, answerTo("e1"));
    await markAnswerSent(context.db, sent, { number: 4, url: "https://forge.example.test/issues/4" });
    const creating = await claim(context, answerTo("e2"));
    const other = await claim(context, answerTo("e3", "example-org/beta-app"));
    await markAnswerSent(context.db, other, { number: 5, url: "https://forge.example.test/issues/5" });

    expect(await findAnswersAwaitingClosure(context.db, KEY)).toEqual({ ok: true, value: [{ id: sent, issueNumber: 4 }] });

    await recordAnswerIssueClosed(context.db, sent, new Date("2026-11-03T10:00:00Z"));
    await recordAnswerIssueClosed(context.db, sent, new Date("2026-11-09T10:00:00Z"));
    await recordAnswerIssueClosed(context.db, creating, new Date("2026-11-03T10:00:00Z"));

    expect(await findAnswersAwaitingClosure(context.db, KEY)).toEqual({ ok: true, value: [] });
    const stored = await findAnswers(context.db);
    expect(stored.ok && stored.value.map((answer) => [answer.entryId, answer.issueClosedAt])).toEqual([
      ["e1", new Date("2026-11-03T10:00:00Z")],
      ["e2", null],
      ["e3", null],
    ]);
  });

  it("refuses a closure on an answer that was never sent", async () => {
    const creating = await claim(context, answerTo("e1"));
    await expect(
      context.db.execute(sql`update projects.answers set issue_closed_at = now() where id = ${creating}`),
    ).rejects.toThrow();
  });
});
