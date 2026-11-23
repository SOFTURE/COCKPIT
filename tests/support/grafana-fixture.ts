// A fictional project's Grafana rules file (as `softure-observability grafana apply` reads it) and Grafana's
// answer listing the rule states, for the observability adapter's tests and the e2e's fake backend.

export interface FixtureRule {
  readonly uid: string;
  readonly title: string;
}

export function createRulesFile(folderUid: string, rules: readonly FixtureRule[]) {
  return {
    folder: { uid: folderUid, title: `${folderUid} alerts` },
    receiver: "owner-mail",
    group: folderUid,
    rules: rules.map((rule) => ({
      uid: rule.uid,
      title: rule.title,
      condition: "A",
      data: [{ refId: "A", datasourceUid: "example-prom", model: { expr: "up" } }],
    })),
  };
}

export interface FixtureRuleState extends FixtureRule {
  readonly state: string;
  readonly folderUid: string;
}

/** `GET /api/prometheus/grafana/api/v1/rules` as Grafana 11.4+ answers it (group and rule folder uids). */
export function createRuleStatesAnswer(rules: readonly FixtureRuleState[]) {
  const folders = [...new Set(rules.map((rule) => rule.folderUid))];
  return {
    status: "success",
    data: {
      groups: folders.map((folderUid) => ({
        name: folderUid,
        file: `${folderUid} alerts`,
        folderUid,
        rules: rules
          .filter((rule) => rule.folderUid === folderUid)
          .map((rule) => ({ uid: rule.uid, name: rule.title, state: rule.state, health: "ok", folderUid, type: "alerting" })),
      })),
    },
  };
}
