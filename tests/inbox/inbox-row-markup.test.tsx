// An inbox row names its project and its entry id in `data-entry`: entry ids repeat across projects (F-8).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { INITIAL_ANSWER_FORM_STATE } from "../../src/inbox/answer-form-state.ts";
import { buildInbox } from "../../src/inbox/build-inbox.ts";
import { InboxRow } from "../../src/inbox/inbox-row.tsx";
import { createStateFixture } from "../support/state-fixture.ts";

const SHARED = { id: "oq-shared", kind: "word" as const, source: "context/foundation/roadmap.md", item: null, since: "2026-11-20", text: "Start the queued roadmap later" };

describe("an inbox row's markup", () => {
  it("gives two projects' rows with the same entry id distinct data-entry values naming the project", () => {
    const inbox = buildInbox(
      ["example-org/alpha-app", "example-org/beta-app"].map((key) => ({ key, fullName: key, state: createStateFixture({ owner_queue: [SHARED] }), issues: [] })),
      new Date("2026-11-24T12:00:00Z"),
      "Europe/Warsaw",
    );
    const copy = getMessages("en").inbox;
    const values = inbox.rows.map((row) => /data-entry="([^"]+)"/.exec(renderToStaticMarkup(<InboxRow row={row} copy={copy} answerAction={() => Promise.resolve(INITIAL_ANSWER_FORM_STATE)} />))?.[1]);
    expect(values).toEqual(["example-org/alpha-app:oq-shared", "example-org/beta-app:oq-shared"]);
  });
});
