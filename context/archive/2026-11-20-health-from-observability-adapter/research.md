# Research: health-from-observability-adapter

## Question
How CMP-21 reads a watched project's health from its observability backend, stores it beside the other scan
results, shows it in the overview and on the project page, and makes an unhealthy project broken (FR-17, FR-8),
while projects without such a source show nothing extra. It also sets the adapter contract CMP-22 reuses.

## Today (master 18683e6)
- The scan (`src/scan/scan-projects.ts`) reads, per project, the state, cockpit issues and the forge facts
  (`src/scan/forge-facts.ts`: release, runs, doctor) and stores them (`modules/projects/reads.ts`,
  `modules/overview/facts.ts`). A forge rate limit stops the scan; other failures are recorded and the scan goes on.
- `src/status/project-status.ts`: broken reasons `state_unreadable`, `ci_failed`, `doctor_failing`.
- `src/overview/build-overview.ts` turns stored reads and facts into rows; `overview-row.tsx` shows chips.
- The project page (`app/(app)/projects/[owner]/[name]/page.tsx`) is still the CMP-2 placeholder; CMP-9 fills it in
  a parallel thread, so this item adds one small health block there and merges with CMP-9 at merge time.
- The job handlers (`src/jobs/handlers.ts`) build the scan with `getForgeClient()` from the environment.
- No adapter exists; `src/adapters/` is empty.

## Which health signal (the roadmap's unknown)
- `@softure-ai/observability` 0.8.8 exports OTLP and keeps each app's **Grafana alert rules as code** in the app's
  repository (`ops/grafana/rules.json` in its README: `folder.uid`, `group`, `rules[].uid`), applied with
  `softure-observability grafana apply`. Its rule builders (service silent, log problems) are the common health
  rules. `parseGrafanaRulesFile` (`@softure-ai/observability/node`) validates that file.
- So the signal is the **alert state of the project's own rules**: unhealthy when any of them fires; healthy when
  none fires. Error rates or raw metrics would need per-project queries COCKPIT cannot know; the rules already
  encode what "unhealthy" means for that project.
- Grafana answers rule states on `GET /api/prometheus/grafana/api/v1/rules` (service account token, alert rules
  read): `data.groups[]` with `folderUid`, and `rules[]` with `uid`, `folderUid`, `name`, `state`
  (`inactive|pending|firing|recovering`) and `health`. The `folder_uid` filter is honoured only from Grafana 11.4
  (grafana/mcp-grafana#891), so COCKPIT also filters on its side: a rule belongs to the project when its `uid` is in
  the file or its folder uid is the file's folder.
- No read API in `@softure-ai/observability` (it only applies); a small client in COCKPIT on `requestJson` of
  `@softure-ai/core` is enough. It is COCKPIT-specific (reading many apps' alert states), not a gap every app hits.

## Configuration (runtime only, never committed)
- `GRAFANA_URL` and `GRAFANA_TOKEN`, the names `softure-observability grafana apply` already uses. Unset: the
  adapter reads nothing and every project shows nothing extra.
- Per project, the rules file is found in the watched repository (Contents: read, already in NFR-5's token) at
  `ops/grafana/rules.json` on the main branch. No file (404): the project has no health source, nothing shows.

## Storage
- A new module `adapters` with its own schema and table `adapters.reads` (one row per project and adapter: status
  `value | absent | unknown`, the value as JSON, the reason, `read_at`). CMP-22 adds `deploy` rows to the same table,
  so neither item collides with migrations of the parallel threads (`overview`, `projects`).
- PRD FR-17: "Given a source fails to answer, then that value shows as unknown with the reason and the scan
  continues": an unknown replaces the last value (unlike forge facts, which keep the last good one).

## Production wiring
- The compose file, deploy workflow and their test are release files of lane R (CMP-23 for this slice). This item
  documents the two variables in `.env.example` and the README; CMP-23 passes them to the app and worker.

## Risks
- One extra forge GET per project per scan (the rules file) and one Grafana call per project, only when Grafana is
  configured; NFR-2's budget stays far away.
- Rule states are read with the scan's interval (30 min default): a firing alert shows within one interval.
