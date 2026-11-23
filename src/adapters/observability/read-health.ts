// The observability adapter's read (FR-17): the project's own Grafana alert rules, kept as code in its repository
// (`ops/grafana/rules.json`, applied by `softure-observability grafana apply`), say what unhealthy means for it.
// The project is unhealthy while any of them fires. Without a configured backend or without the file the project
// has no health source and shows nothing extra.
import { parseGrafanaRulesFile } from "@softure-ai/observability/node";
import type { AdapterContext, AdapterRead } from "../contract.ts";
import { getGrafanaRuleStates, type GrafanaRuleState, type GrafanaSource } from "./grafana-rules.ts";
import type { HealthUnknownReason, ProjectHealth } from "./project-health.ts";

/** Where a project keeps its alert rules, as the `@softure-ai/observability` README names it. */
export const RULES_FILE_PATH = "ops/grafana/rules.json";

const FIRING_STATES = new Set(["firing", "alerting"]);

export interface ReadHealthOptions extends AdapterContext {
  /** Null while the operator has not configured a backend: nothing is read. */
  readonly grafana: GrafanaSource | null;
}

function unknown(reason: HealthUnknownReason): AdapterRead<ProjectHealth> {
  return { status: "unknown", reason };
}

function belongsToProject(rule: GrafanaRuleState, folderUid: string, ruleUids: ReadonlySet<string>): boolean {
  return (rule.uid !== null && ruleUids.has(rule.uid)) || rule.folderUid === folderUid;
}

export async function readHealth({ client, project, grafana }: ReadHealthOptions): Promise<AdapterRead<ProjectHealth>> {
  if (grafana === null) {
    return { status: "absent" };
  }
  const file = await client.getJsonFile(project.owner, project.name, RULES_FILE_PATH, project.branch);
  if (!file.ok) {
    if (file.kind === "rate_limited") {
      return { status: "rate_limited", retryAfterSeconds: file.retryAfterSeconds };
    }
    return file.kind === "not_found" ? { status: "absent" } : unknown(file.kind === "invalid_answer" ? "rules_invalid" : "rules_unreadable");
  }
  const parsed = parseGrafanaRulesFile(file.value);
  if (!parsed.isValid) {
    return unknown("rules_invalid");
  }
  const { folder, rules } = parsed.value;
  const states = await getGrafanaRuleStates(grafana, folder.uid);
  if (!states.ok) {
    const reasons = { refused: "backend_refused", unavailable: "backend_unavailable", invalid_answer: "backend_invalid_answer" } as const;
    return unknown(reasons[states.kind]);
  }
  const ruleUids = new Set(rules.map((rule) => rule.uid));
  const own = states.rules.filter((rule) => belongsToProject(rule, folder.uid, ruleUids));
  if (own.length === 0) {
    return unknown("rules_not_applied");
  }
  const firing = own.filter((rule) => FIRING_STATES.has(rule.state.toLowerCase())).map((rule) => rule.title);
  return { status: "value", value: firing.length > 0 ? { kind: "unhealthy", firing } : { kind: "healthy", rules: own.length } };
}
