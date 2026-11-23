# Plan review: cli-release-ready

Reviewed against change.md, research.md, the roadmap (CMP-17, CMP-18), PRD FR-15, AGENTS.md and the code on master
e2134c5.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | A publish workflow that runs on a push or a tag would publish without the owner's word. | Fix: `workflow_dispatch` only, in an environment `npm` the owner can protect; stated in the plan. |
| 2 | WARNING | A re-run of the publish workflow on an already published version fails late and noisily. | Fix: the workflow checks `npm view <name>@<version>` first and stops with a message. |
| 3 | SUGGESTION | `npm publish --dry-run` alone does not prove the installed bin runs. | Applied: the dry run installs the tarball into a scratch prefix and runs `cockpit --help`. |
| 4 | SUGGESTION | The package README could drift from the root README's Terminal section. | Accept: the package README is short (install, env, commands) and links to the repository. |

Verdict: ready to implement after the fixes above (applied to the plan).
