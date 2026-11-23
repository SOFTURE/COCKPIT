// Reads alert rule states from Grafana's Prometheus-compatible rules API with a service account token. Failures
// carry a code only: never the URL, the token or the answer (NFR-6).
import { requestJson, type FetchFunction } from "@softure-ai/core";
import { z } from "zod";

const ruleSchema = z.looseObject({
  name: z.string(),
  state: z.string(),
  uid: z.string().optional(),
  folderUid: z.string().optional(),
});

const answerSchema = z.object({
  data: z.object({
    groups: z.array(z.looseObject({ name: z.string(), folderUid: z.string().optional(), rules: z.array(ruleSchema) })),
  }),
});

export interface GrafanaRuleState {
  readonly uid: string | null;
  readonly title: string;
  readonly folderUid: string | null;
  /** `inactive`, `pending`, `firing`, `recovering` as Grafana names them. */
  readonly state: string;
}

export type GrafanaRulesRead =
  | { readonly ok: true; readonly rules: readonly GrafanaRuleState[] }
  | { readonly ok: false; readonly kind: "refused" | "unavailable" | "invalid_answer" };

export interface GrafanaSource {
  readonly url: string;
  readonly token: string;
  readonly fetch?: FetchFunction;
}

/** The rule states of one folder; Grafana before 11.4 ignores the filter, so callers filter again. */
export async function getGrafanaRuleStates(source: GrafanaSource, folderUid: string): Promise<GrafanaRulesRead> {
  const root = source.url.replace(/\/+$/, "");
  const result = await requestJson({
    url: `${root}/api/prometheus/grafana/api/v1/rules?folder_uid=${encodeURIComponent(folderUid)}`,
    headers: { Accept: "application/json", Authorization: `Bearer ${source.token}` },
    schema: answerSchema,
    fetch: source.fetch,
  });
  if (!result.ok) {
    if (result.error === "core.http_refused") {
      return { ok: false, kind: "refused" };
    }
    return { ok: false, kind: result.error === "core.http_unexpected_answer" ? "invalid_answer" : "unavailable" };
  }
  const rules = result.value.data.groups.flatMap((group) =>
    group.rules.map((rule) => ({
      uid: rule.uid ?? null,
      title: rule.name,
      folderUid: rule.folderUid ?? group.folderUid ?? null,
      state: rule.state,
    })),
  );
  return { ok: true, rules };
}
