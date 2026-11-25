import { readFileSync } from "node:fs";
import { parseGrafanaDashboard, parseGrafanaRulesFile } from "@softure-ai/observability/node";
import { describe, expect, it } from "vitest";
import { SERVICE_NAMES, SERVICE_NAMESPACE } from "../../src/observability/service.ts";

const RULES: unknown = JSON.parse(readFileSync("ops/grafana/rules.json", "utf8"));
const DASHBOARD_JSON: unknown = JSON.parse(readFileSync("ops/grafana/dashboard.json", "utf8"));
const DASHBOARD = DASHBOARD_JSON as { uid?: unknown; title?: unknown; panels?: unknown[] };

describe("COCKPIT's Grafana rules and dashboard", () => {
  it("parse with the observability package's schema, in the cockpit folder, notifying one contact point", () => {
    const parsed = parseGrafanaRulesFile(RULES);
    expect(parsed.isValid).toBe(true);
    if (!parsed.isValid) {
      return;
    }
    expect(parsed.value.folder).toEqual({ uid: "cockpit", title: "COCKPIT" });
    expect(parsed.value.receiver).toBe("COCKPIT · mail");
    expect(parsed.value.rules.map((rule) => rule.uid)).toEqual(["cockpit-app-silent", "cockpit-worker-silent", "cockpit-log-errors"]);
  });

  it("watch the names the processes export under, in production", () => {
    const text = JSON.stringify(RULES);
    expect(text).toContain(`service_name=\\"${SERVICE_NAMES.web}\\"`);
    expect(text).toContain(`service_name=\\"${SERVICE_NAMES.worker}\\"`);
    expect(text).toContain(`service_namespace=\\"${SERVICE_NAMESPACE}\\", deployment_environment=\\"production\\"`);
  });

  it("keep a dashboard the package applies, with a uid, a title and panels", () => {
    expect(parseGrafanaDashboard(DASHBOARD_JSON).isValid).toBe(true);
    expect(DASHBOARD.uid).toBe("cockpit-overview");
    expect(DASHBOARD.title).toBe("COCKPIT");
    expect(DASHBOARD.panels?.length).toBeGreaterThan(0);
  });
});
