import type { SoftureConfig } from "@softure-ai/core";
import { runScheduleNow } from "@softure-ai/jobs/server";
import { runDueJobs } from "@softure-ai/jobs/testing";
import { mailing } from "@softure-ai/mailing";
import { suppressRecipient } from "@softure-ai/mailing/server";
import { fakeMailProvider, type FakeMailProvider } from "@softure-ai/mailing/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findLatestDigest, findPendingDigest } from "../../modules/digest/digests.ts";
import { recordForgeFacts } from "../../modules/overview/facts.ts";
import { insertRepository } from "../../modules/projects/queries.ts";
import { recordRead } from "../../modules/projects/reads.ts";
import { createDigestHandler } from "../../src/digest/digest-handler.ts";
import { DIGEST_QUEUE } from "../../src/digest/digest-queue.ts";
import { runDigest, type DigestContext } from "../../src/digest/run-digest.ts";
import type { ProjectState } from "../../src/state/state-schema.ts";
import { createStateFixture } from "../support/state-fixture.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const ALPHA = "example-org/alpha-app";
const RECIPIENTS = ["owner@example.com", "partner@example.com"];
const SETTINGS = { recipients: RECIPIENTS };
const HOUR = 3_600_000;

const BASE_STATE = createStateFixture();

const CHANGED_STATE: ProjectState = createStateFixture({
  updated_at: "2026-11-02T08:00:00Z",
  active_roadmap: {
    ...(BASE_STATE.active_roadmap ?? { slug: null, title: null, status: null, version: null, path: "", done: 0, total: 0, items: [] }),
    done: 2,
    items: [
      ...(BASE_STATE.active_roadmap?.items ?? []),
      { id: "AL-2", change_id: "second-screen", outcome: "the second screen", status: "done", stage: null, since: null, detail: null, prerequisites: [], mode: "autonomous" },
    ],
  },
  owner_queue: [
    ...BASE_STATE.owner_queue,
    { id: "oq-9f8e7d", kind: "word", source: "context/foundation/roadmap.md", item: null, since: "2026-11-02", text: "Release 1.1.0?" },
  ],
});

const FAILED_CI = { result: "failed", url: "https://forge.example.test/run/2", at: "2026-11-02T08:30:00Z" };

describe("the digest run", () => {
  let context: TestContext;
  let provider: FakeMailProvider;
  let digestContext: DigestContext;

  async function scan(state: ProjectState, ci: unknown = null): Promise<void> {
    const readAt = context.clock.now();
    await recordRead(context.db, { key: ALPHA, status: "ok", issuesStatus: "ok", state, issues: [], readAt });
    await recordForgeFacts(context.db, {
      key: ALPHA,
      release: { status: "ok", value: null },
      runs: { status: "ok", value: { ci, qualityReview: null } },
      doctor: { status: "ok", value: { kind: "ok", url: null } },
      readAt,
    });
  }

  beforeEach(async () => {
    vi.stubEnv("MAILING_UNSUBSCRIBE_SECRET", "a-fictional-unsubscribe-secret-for-tests-only");
    vi.stubEnv("SOFTURE_EMAIL_KEY_SECRET", "a-fictional-email-key-secret-for-tests-only");
    context = await createTestContext();
    provider = fakeMailProvider();
    const config: SoftureConfig = {
      ...context.config,
      appOrigin: "https://cockpit.example.test",
      modules: context.config.modules.map((module) =>
        module.manifest.id === "mailing" ? mailing({ from: "COCKPIT <digest@example.com>", provider }) : module,
      ),
    };
    digestContext = { db: context.db, clock: context.clock, config };
    await insertRepository(context.db, {
      key: ALPHA,
      fullName: ALPHA,
      defaultBranch: "main",
      hasState: true,
      missingPermissions: [],
      checkedAt: TEST_START,
    });
    await scan(BASE_STATE);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await context.database.close();
  });

  it("records a baseline first and sends nothing after two scans with no change", async () => {
    expect(await runDigest(digestContext, SETTINGS)).toEqual({ ok: true, value: { kind: "baseline" } });
    context.clock.advance(HOUR);
    await scan(BASE_STATE);
    context.clock.advance(HOUR);
    await scan(BASE_STATE);
    expect(await runDigest(digestContext, SETTINGS)).toEqual({ ok: true, value: { kind: "unchanged" } });
    expect(provider.sent).toEqual([]);
  });

  it("sends one mail per recipient listing a merged item, a new entry and a broken project, each with a link", async () => {
    await runDigest(digestContext, SETTINGS);
    context.clock.advance(HOUR);
    await scan(CHANGED_STATE, FAILED_CI);

    const run = await runDigest(digestContext, SETTINGS);
    expect(run).toMatchObject({ ok: true, value: { kind: "sent" } });
    expect(provider.sent.map((mail) => mail.to)).toEqual(RECIPIENTS);
    const [mail] = provider.sent;
    expect(mail?.subject).toBe("COCKPIT: 3 changes since the last digest");
    expect(mail?.text).toContain("Shipped\n- example-org/alpha-app: AL-2, the second screen\n  https://cockpit.example.test/projects/example-org/alpha-app");
    expect(mail?.text).toContain("Waits for you\n- example-org/alpha-app: Release 1.1.0?\n  https://cockpit.example.test/inbox");
    expect(mail?.text).toContain("Broke\n- example-org/alpha-app: the last CI run on its main branch failed");
    expect(mail?.headers["List-Unsubscribe"]).toMatch(/^<https:\/\/cockpit\.example\.test\/api\/mailing\/unsubscribe\?r=.+&t=.+>$/);
    expect(mail?.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(await findLatestDigest(context.db)).toMatchObject({ ok: true, value: { status: "sent" } });

    context.clock.advance(HOUR);
    expect(await runDigest(digestContext, SETTINGS)).toEqual({ ok: true, value: { kind: "unchanged" } });
    expect(provider.sent).toHaveLength(2);
  });

  it("records a quiet change without mail, so a later change is measured from it", async () => {
    await scan(createStateFixture({ owner_queue: [] }));
    await runDigest(digestContext, SETTINGS);
    await scan(createStateFixture({ owner_queue: [], updated_at: "2026-11-02T07:00:00Z" }), FAILED_CI);
    await runDigest(digestContext, SETTINGS);
    await scan(createStateFixture({ owner_queue: [], updated_at: "2026-11-02T07:00:00Z" }));
    expect(await runDigest(digestContext, SETTINGS)).toEqual({ ok: true, value: { kind: "quiet" } });
    expect(provider.sent).toHaveLength(2);
  });

  it("retries a provider outage with the same mail, sent once to each recipient", async () => {
    await runDigest(digestContext, SETTINGS);
    await scan(CHANGED_STATE);
    let isDown = true;
    const flaky = fakeMailProvider({ respond: () => (isDown ? { status: "unavailable", httpStatus: 503 } : undefined) });
    const flakyContext: DigestContext = {
      ...digestContext,
      config: { ...digestContext.config, modules: digestContext.config.modules.map((module) => (module.manifest.id === "mailing" ? mailing({ from: "COCKPIT <digest@example.com>", provider: flaky }) : module)) },
    };

    expect(await runDigest(flakyContext, SETTINGS)).toEqual({ ok: true, value: { kind: "retry_later", seconds: 300 } });
    const pending = await findPendingDigest(context.db);
    expect(pending).toMatchObject({ ok: true, value: { status: "pending" } });

    // The projects move on meanwhile; the retry still sends what the first attempt rendered.
    await scan(BASE_STATE, FAILED_CI);
    isDown = false;
    expect(await runDigest(flakyContext, SETTINGS)).toMatchObject({ ok: true, value: { kind: "sent" } });
    expect(flaky.sent.map((mail) => mail.subject)).toEqual(["COCKPIT: 2 changes since the last digest", "COCKPIT: 2 changes since the last digest"]);
    expect(await runDigest(flakyContext, SETTINGS)).toMatchObject({ ok: true, value: { kind: "sent" } });
    expect(flaky.sent).toHaveLength(4);
  });

  it("sends nothing to a recipient who unsubscribed", async () => {
    await suppressRecipient(digestContext, "partner@example.com");
    await runDigest(digestContext, SETTINGS);
    await scan(CHANGED_STATE);
    expect(await runDigest(digestContext, SETTINGS)).toMatchObject({ ok: true, value: { kind: "sent" } });
    expect(provider.sent.map((mail) => mail.to)).toEqual(["owner@example.com"]);
  });

  it("runs on its schedule, and fails without retries when it is not configured", async () => {
    const configured = { [DIGEST_QUEUE]: createDigestHandler(() => SETTINGS) };
    await runScheduleNow(context, DIGEST_QUEUE);
    expect(await runDueJobs(context, { handlers: configured })).toMatchObject({ succeeded: 1, failed: 0 });
    expect(await findLatestDigest(context.db)).toMatchObject({ ok: true, value: { status: "baseline" } });

    await runScheduleNow(context, DIGEST_QUEUE);
    expect(await runDueJobs(context, { handlers: { [DIGEST_QUEUE]: createDigestHandler(() => null) } })).toMatchObject({ succeeded: 0, failed: 1 });
  });
});
