# Implementation review: cli-release-ready

Reviewed the diff e2134c5..f810dfa against plan.md, change.md, the roadmap (CMP-17, CMP-18), PRD FR-15 and AGENTS.md.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | `publish-cli` treats any failure of `npm view` (a network error too) as "not published" and goes on to publish. | Accept: `npm publish` itself refuses an existing version, so the guard only turns that refusal into a clear message; it never publishes twice. |
| 2 | SUGGESTION | The bundle inlines zod's locales (about 475 KB minified, 105 KB packed). | Accept: size does not matter for a terminal command; trimming would mean a second schema library. |
| 3 | SUGGESTION | `cli/README.md` repeats the root README's Terminal section. | Accept: it is the npm page and stays short; the plan review accepted the same. |

Drift from plan: none. Tests: the package test fails when the manifest's `bin` is dropped (mutation checked); the e2e
compares the packed binary's output for overview, `inbox --json` and project with the checkout's against the running
app. Security: no token in the repository; `NPM_TOKEN` reaches only the publish step, in an environment the owner
controls; the workflow runs only on `workflow_dispatch`.

Verdict: ready.
