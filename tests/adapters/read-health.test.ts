import { fakeFetch, type FakeFetchRoute } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { createObservabilityAdapter, getGrafanaSource } from "../../src/adapters/observability/observability-adapter.ts";
import { RULES_FILE_PATH } from "../../src/adapters/observability/read-health.ts";
import { TEST_FORGE_API, type ScanAnswer } from "../support/fake-forge-routes.ts";
import { createRulesFile, createRuleStatesAnswer } from "../support/grafana-fixture.ts";

const GRAFANA = "https://grafana.example.test";
const GRAFANA_TOKEN = "grafana-secret-token";
const PROJECT = { owner: "example-org", name: "alpha-app", branch: "main" };
const RULES_URL = `${TEST_FORGE_API}/repos/example-org/alpha-app/contents/${RULES_FILE_PATH}?ref=main`;
const STATES_URL = `${GRAFANA}/api/prometheus/grafana/api/v1/rules?folder_uid=alpha-alerts`;
const RULES = createRulesFile("alpha-alerts", [
  { uid: "alpha-silent", title: "Alpha app silent" },
  { uid: "alpha-errors", title: "Alpha app logs errors" },
]);

function readWith(routes: { forge: FakeFetchRoute[]; grafana: FakeFetchRoute[] }, configured = true) {
  const forge = fakeFetch(routes.forge);
  const grafana = fakeFetch(routes.grafana);
  const source = configured ? getGrafanaSource({ GRAFANA_URL: GRAFANA, GRAFANA_TOKEN }, grafana.fetch) : null;
  const adapter = createObservabilityAdapter(source);
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  return { forge, grafana, read: () => adapter.read({ client, project: PROJECT }) };
}

const rulesFile = (answer: ScanAnswer): FakeFetchRoute[] => [{ method: "GET", url: RULES_URL, ...answer }];
const ruleStates = (answer: ScanAnswer): FakeFetchRoute[] => [{ method: "GET", url: STATES_URL, ...answer }];

describe("the observability adapter", () => {
  it("reads nothing while no backend is configured", async () => {
    const { forge, grafana, read } = readWith({ forge: [], grafana: [] }, false);
    await expect(read()).resolves.toEqual({ status: "absent" });
    expect(forge.calls).toHaveLength(0);
    expect(grafana.calls).toHaveLength(0);
  });

  it("needs both the backend URL and its token", () => {
    expect(getGrafanaSource({ GRAFANA_URL: GRAFANA })).toBeNull();
    expect(getGrafanaSource({ GRAFANA_TOKEN: " " , GRAFANA_URL: GRAFANA })).toBeNull();
    expect(getGrafanaSource({ GRAFANA_URL: ` ${GRAFANA} `, GRAFANA_TOKEN })).toMatchObject({ url: GRAFANA, token: GRAFANA_TOKEN });
  });

  it("is absent for a project without a rules file, asking the backend nothing", async () => {
    const { grafana, read } = readWith({ forge: rulesFile({ status: 404, json: { message: "Not Found" } }), grafana: [] });
    await expect(read()).resolves.toEqual({ status: "absent" });
    expect(grafana.calls).toHaveLength(0);
  });

  it("is unhealthy while any of the project's rules fires, naming the firing ones", async () => {
    const { grafana, read } = readWith({
      forge: rulesFile({ json: RULES }),
      grafana: ruleStates({
        json: createRuleStatesAnswer([
          { uid: "alpha-silent", title: "Alpha app silent", state: "firing", folderUid: "alpha-alerts" },
          { uid: "alpha-errors", title: "Alpha app logs errors", state: "pending", folderUid: "alpha-alerts" },
        ]),
      }),
    });
    await expect(read()).resolves.toEqual({ status: "value", value: { kind: "unhealthy", firing: ["Alpha app silent"] } });
    expect(grafana.calls[0]?.headers.authorization).toBe(`Bearer ${GRAFANA_TOKEN}`);
  });

  it("is healthy when none of its rules fires (pending, inactive, recovering)", async () => {
    const { read } = readWith({
      forge: rulesFile({ json: RULES }),
      grafana: ruleStates({
        json: createRuleStatesAnswer([
          { uid: "alpha-silent", title: "Alpha app silent", state: "pending", folderUid: "alpha-alerts" },
          { uid: "alpha-errors", title: "Alpha app logs errors", state: "inactive", folderUid: "alpha-alerts" },
        ]),
      }),
    });
    await expect(read()).resolves.toEqual({ status: "value", value: { kind: "healthy", rules: 2 } });
  });

  it("ignores rules of other folders, which a Grafana before 11.4 also returns", async () => {
    const { read } = readWith({
      forge: rulesFile({ json: RULES }),
      grafana: ruleStates({
        json: createRuleStatesAnswer([
          { uid: "alpha-silent", title: "Alpha app silent", state: "inactive", folderUid: "alpha-alerts" },
          { uid: "beta-silent", title: "Beta app silent", state: "firing", folderUid: "beta-alerts" },
        ]),
      }),
    });
    await expect(read()).resolves.toEqual({ status: "value", value: { kind: "healthy", rules: 1 } });
  });

  it("matches a rule by its uid when Grafana does not name its folder", async () => {
    const answer = { data: { groups: [{ name: "alpha", rules: [{ uid: "alpha-errors", name: "Alpha app logs errors", state: "Alerting" }] }] } };
    const { read } = readWith({ forge: rulesFile({ json: RULES }), grafana: ruleStates({ json: answer }) });
    await expect(read()).resolves.toEqual({ status: "value", value: { kind: "unhealthy", firing: ["Alpha app logs errors"] } });
  });

  it("is unknown when none of the project's rules is in the backend", async () => {
    const { read } = readWith({ forge: rulesFile({ json: RULES }), grafana: ruleStates({ json: createRuleStatesAnswer([]) }) });
    await expect(read()).resolves.toEqual({ status: "unknown", reason: "rules_not_applied" });
  });

  it.each([
    ["an invalid rules file", rulesFile({ json: { folder: { uid: "" } } }), "rules_invalid"],
    ["a refused rules file", rulesFile({ status: 403, json: { message: "Forbidden" } }), "rules_unreadable"],
    ["an unavailable forge", rulesFile({ status: 502, json: {} }), "rules_unreadable"],
  ])("is unknown for %s", async (_label, forge, reason) => {
    const { grafana, read } = readWith({ forge, grafana: [] });
    await expect(read()).resolves.toEqual({ status: "unknown", reason });
    expect(grafana.calls).toHaveLength(0);
  });

  it.each([
    ["refuses the token", { status: 401, json: { message: "Unauthorized" } }, "backend_refused"],
    ["is forbidden", { status: 403, json: { message: "Forbidden" } }, "backend_refused"],
    ["is down", { status: 503, json: {} }, "backend_unavailable"],
    ["answers something else", { json: { data: { alerts: [] } } }, "backend_invalid_answer"],
  ])("is unknown when the backend %s, without the token in the reason", async (_label, answer, reason) => {
    const { read } = readWith({ forge: rulesFile({ json: RULES }), grafana: ruleStates(answer) });
    const result = await read();
    expect(result).toEqual({ status: "unknown", reason });
    expect(JSON.stringify(result)).not.toContain(GRAFANA_TOKEN);
  });

  it("passes a forge rate limit on, so the scan stops", async () => {
    const { read } = readWith({
      forge: rulesFile({ status: 429, json: { message: "slow down" }, headers: { "retry-after": "30" } }),
      grafana: [],
    });
    await expect(read()).resolves.toEqual({ status: "rate_limited", retryAfterSeconds: 30 });
  });

  it("asks an unreachable backend once per scan, then reports it unavailable at once", async () => {
    const forge = fakeFetch([{ method: "GET", url: RULES_URL, json: RULES, repeat: true }]);
    let calls = 0;
    const unreachable = () => {
      calls += 1;
      return Promise.reject(new TypeError("fetch failed"));
    };
    const adapter = createObservabilityAdapter(getGrafanaSource({ GRAFANA_URL: GRAFANA, GRAFANA_TOKEN }, unreachable));
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    await expect(adapter.read({ client, project: PROJECT })).resolves.toEqual({ status: "unknown", reason: "backend_unavailable" });
    await expect(adapter.read({ client, project: PROJECT })).resolves.toEqual({ status: "unknown", reason: "backend_unavailable" });
    expect(calls).toBe(1);
  });
});
