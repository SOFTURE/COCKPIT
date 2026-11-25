import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findRoutines } from "../../modules/projects/routines.ts";
import {
  addProjectRoutine,
  removeRoutine,
  replaceRoutineToken,
  setRoutineEnabled,
  testRoutine,
  type ManageContext,
  type NewRoutineInput,
} from "../../src/routines/manage-routines.ts";
import { buildRoutinesTab } from "../../src/routines/routines-tab.ts";
import { createTokenBox } from "../../src/routines/token-box.ts";
import { captureLogs, type CapturedLogs } from "../support/capture-logs.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";
import { createFakeRoutinesApi, type FakeRoutinesApi } from "./fake-routines-api.ts";

const ALPHA = "example-org/alpha-app";
const TOKEN = "fictional-routine-token-k2m4";
const box = createTokenBox("fictional-routine-token-secret-0001");

describe("managing a project's routines", () => {
  let context: TestContext;
  let manage: ManageContext;
  let api: FakeRoutinesApi;
  let logs: CapturedLogs;
  const input: NewRoutineInput = { repositoryKey: ALPHA, name: "  Coordinator \n main ", kind: "", trigger: "https://api.anthropic.com/v1/claude_code/routines/trig_01Alpha/fire", token: ` ${TOKEN} `, enabled: true };

  async function stored() {
    const listed = await findRoutines(context.db, ALPHA);
    return listed.ok ? listed.value : [];
  }

  beforeEach(async () => {
    context = await createTestContext();
    manage = { db: context.db, clock: context.clock, box };
    api = createFakeRoutinesApi();
    logs = captureLogs();
  });

  afterEach(async () => {
    logs.restore();
    await context.database.close();
  });

  it("adds a routine with the trigger id from its fire URL, the default kind and the token sealed", async () => {
    const added = await addProjectRoutine(manage, input);

    expect(added.ok).toBe(true);
    const [routine] = await stored();
    expect(routine).toMatchObject({ name: "Coordinator main", kind: "cockpit-issues", triggerId: "trig_01Alpha", tokenLast4: "k2m4", enabled: true, lastFireOk: null });
    expect(routine?.tokenCiphertext).not.toContain(TOKEN);
    expect(box.open(routine?.tokenCiphertext ?? "")).toBe(TOKEN);
  });

  it("keeps many routines per project", async () => {
    await addProjectRoutine(manage, input);
    await addProjectRoutine(manage, { ...input, name: "Coordinator spare", trigger: "trig_01Spare" });

    expect((await stored()).map((routine) => [routine.name, routine.kind])).toEqual([
      ["Coordinator main", "cockpit-issues"],
      ["Coordinator spare", "cockpit-issues"],
    ]);
  });

  it("refuses a missing name, a kind outside the list, a bad trigger, a missing token and a missing secret, storing nothing", async () => {
    expect(await addProjectRoutine(manage, { ...input, name: " " })).toEqual({ ok: false, error: "routines.name_missing" });
    expect(await addProjectRoutine(manage, { ...input, kind: "Cockpit Issues" })).toEqual({ ok: false, error: "routines.kind_invalid" });
    expect(await addProjectRoutine(manage, { ...input, kind: "reports" })).toEqual({ ok: false, error: "routines.kind_invalid" });
    expect(await addProjectRoutine(manage, { ...input, trigger: "https://example.test/hook" })).toEqual({ ok: false, error: "routines.trigger_invalid" });
    expect(await addProjectRoutine(manage, { ...input, token: "  " })).toEqual({ ok: false, error: "routines.token_missing" });
    expect(await addProjectRoutine({ ...manage, box: null }, input)).toEqual({ ok: false, error: "routines.secret_missing" });
    expect(await stored()).toEqual([]);
  });

  it("replaces the token, enables, disables and deletes, only within the routine's own project", async () => {
    const added = await addProjectRoutine(manage, input);
    const id = added.ok ? added.value.id : 0;

    expect(await replaceRoutineToken(manage, ALPHA, id, "fictional-new-token-zz99")).toEqual({ ok: true, value: undefined });
    expect((await stored())[0]?.tokenLast4).toBe("zz99");
    expect(box.open((await stored())[0]?.tokenCiphertext ?? "")).toBe("fictional-new-token-zz99");
    expect(await setRoutineEnabled(manage, ALPHA, id, false)).toEqual({ ok: true, value: undefined });
    expect((await stored())[0]?.enabled).toBe(false);

    expect(await setRoutineEnabled(manage, "example-org/beta-app", id, true)).toEqual({ ok: false, error: "routines.not_found" });
    expect(await removeRoutine(manage, "example-org/beta-app", id)).toEqual({ ok: false, error: "routines.not_found" });
    expect(await removeRoutine(manage, ALPHA, id)).toEqual({ ok: true, value: undefined });
    expect(await stored()).toEqual([]);
    expect(await removeRoutine(manage, ALPHA, id)).toEqual({ ok: false, error: "routines.not_found" });
  });

  it("tests a routine with the test text and answers the HTTP result, recording the call", async () => {
    const added = await addProjectRoutine(manage, input);
    const id = added.ok ? added.value.id : 0;

    expect(await testRoutine({ ...manage, api }, ALPHA, id)).toEqual({ ok: true, value: { kind: "sent", status: 200 } });
    expect(api.calls).toEqual([{ triggerId: "trig_01Alpha", token: TOKEN, text: "COCKPIT test: reply in this chat that the test arrived; change nothing." }]);
    expect((await stored())[0]).toMatchObject({ lastFireOk: true, lastFireStatus: 200 });

    api.script("trig_01Alpha", { ok: false, status: 404, reason: "not_found", retryAfterSeconds: null });
    expect(await testRoutine({ ...manage, api }, ALPHA, id)).toEqual({ ok: true, value: { kind: "failed", status: 404, reason: "not_found" } });
    expect((await stored())[0]).toMatchObject({ lastFireOk: false, lastFireStatus: 404 });

    expect(await testRoutine({ ...manage, api, limits: { perRoutine: 2, total: 100, windowMs: 3_600_000 } }, ALPHA, id)).toEqual({
      ok: true,
      value: { kind: "failed", status: null, reason: "limit" },
    });
    expect(await testRoutine({ ...manage, api }, "example-org/beta-app", id)).toEqual({ ok: false, error: "routines.not_found" });
  });

  it("never logs the token, and sends the browser only its last four characters", async () => {
    await addProjectRoutine(manage, input);
    const [routine] = await stored();
    await replaceRoutineToken(manage, ALPHA, routine?.id ?? 0, TOKEN);
    await testRoutine({ ...manage, api }, ALPHA, routine?.id ?? 0);

    expect(logs.lines().join("\n")).not.toContain(TOKEN);
    const tab = buildRoutinesTab(await stored(), [], true);
    expect(JSON.stringify(tab)).not.toContain(TOKEN);
    expect(JSON.stringify(tab)).not.toContain(routine?.tokenCiphertext ?? "-");
    expect(tab.routines[0]).not.toHaveProperty("tokenCiphertext");
    expect(tab.routines[0]?.tokenLast4).toBe("k2m4");
  });
});
