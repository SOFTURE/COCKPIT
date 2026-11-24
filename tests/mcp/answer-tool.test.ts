import { describe, expect, it } from "vitest";
import { toEntryAnswerRequest, type AnswerEntryToolInput } from "../../src/mcp/answer-tool.ts";
import { buildInbox } from "../../src/inbox/build-inbox.ts";
import { createStateFixture } from "../support/state-fixture.ts";

const ALPHA = "example-org/alpha-app";
const BETA = "example-org/beta-app";
const ENTRY_ID = "oq-shared";

function entry(text: string) {
  return { id: ENTRY_ID, kind: "word" as const, source: "context/foundation/roadmap.md", item: null, since: "2026-11-20", text };
}

/** Stands in for the untrusted-data defusing: it changes the text, so only the right row's text maps back. */
const defuse = (text: string) => text.replaceAll("<", "‹");

describe("the MCP answer request with the same entry id in two projects (F-8)", () => {
  const inbox = buildInbox(
    [
      { key: ALPHA, fullName: ALPHA, state: createStateFixture({ owner_queue: [entry("Start <alpha> later")] }), issues: [] },
      { key: BETA, fullName: BETA, state: createStateFixture({ owner_queue: [entry("Start <beta> later")] }), issues: [] },
    ],
    new Date("2026-11-24T12:00:00Z"),
    "Europe/Warsaw",
  );

  function request(project: string, text: string) {
    const input: AnswerEntryToolInput = { project, entry: ENTRY_ID, text, answer: "later" };
    return toEntryAnswerRequest({ input, inbox, userId: "user-1", defuse });
  }

  it("targets the named project and maps the text it read back to that project's own entry", () => {
    expect(request(BETA, "Start ‹beta> later")).toEqual({
      ok: true,
      value: { userId: "user-1", repositoryKey: BETA, entryId: ENTRY_ID, entryText: "Start <beta> later", answer: "later", note: null },
    });
    expect(request("Example-Org/Alpha-App", "Start ‹alpha> later")).toMatchObject({ ok: true, value: { repositoryKey: ALPHA, entryText: "Start <alpha> later" } });
  });

  it("never lets the other project's entry stand in for the named one", () => {
    expect(request(ALPHA, "Start ‹beta> later")).toMatchObject({ ok: true, value: { repositoryKey: ALPHA, entryText: "Start ‹beta> later" } });
  });
});
