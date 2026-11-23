import { readFile } from "node:fs/promises";
import { createTestAccount } from "@softure-ai/auth/testing";
import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimAnswer, findAnswers, type NewAnswer } from "../../modules/projects/answers.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";

const MIGRATION = new URL("../../modules/projects/migrations/0004_add_answered_by_name.sql", import.meta.url);

/** The backfill statement of the migration, run again on rows stored without a name. */
async function runBackfill(context: TestContext) {
  const text = await readFile(MIGRATION, "utf8");
  const backfill = text.slice(text.indexOf("UPDATE answers"));
  await context.db.execute(sql.raw(backfill.replace("UPDATE answers", "UPDATE projects.answers").replaceAll("answers.answered_by", "projects.answers.answered_by")));
}

function answerBy(userId: string, entryId: string): NewAnswer {
  return {
    repositoryKey: "example-org/alpha-app",
    fullName: "example-org/alpha-app",
    entryId,
    entryText: `Entry ${entryId}`,
    entryKind: "decision",
    entrySource: "context/foundation/roadmap.md",
    entryItem: null,
    answer: "yes",
    note: null,
    answeredBy: userId,
    answeredByName: null,
    answeredAt: new Date("2026-11-02T09:00:00Z"),
  };
}

describe("migration projects/0004: answered_by_name", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("names existing answers after their account and leaves answers of a missing account without a name", async () => {
    const owner = await createTestAccount(context.db, { email: "owner@example.com", password: "a long test password" });
    await claimAnswer(context.db, answerBy(owner.id, "e1"));
    await claimAnswer(context.db, answerBy("00000000-0000-4000-8000-000000000000", "e2"));

    await runBackfill(context);

    const answers = await findAnswers(context.db);
    expect(answers.ok && answers.value.map((row) => [row.entryId, row.answeredByName])).toEqual([
      ["e1", "owner@example.com"],
      ["e2", null],
    ]);
  });

  it("refuses an empty name", async () => {
    const stored = await claimAnswer(context.db, { ...answerBy("user-1", "e3"), answeredByName: "" });

    expect(stored.ok).toBe(false);
  });
});
