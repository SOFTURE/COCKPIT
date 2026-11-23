# Research: doctor-status-per-project

## Question
How CMP-7 reads each watched project's doctor result (`ok`, `failing` with its codes and their count, `pending`,
`missing`) from the forge, stores it beside the other forge facts and shows it in the overview, where a failing
doctor makes the project broken (FR-7, FR-8).

## Today (master 8c76b32)
- The scan's forge step (`src/scan/forge-facts.ts`) reads the latest release and the main branch's workflow runs
  (`src/forge/runs.ts`, one `actions/runs?branch=` page) and stores them in `overview.forge_facts` (CMP-6). A rate
  limit stops the scan; any other failure keeps the last good value with a read status.
- `src/status/project-status.ts`: broken reasons `state_unreadable` and `ci_failed`; no doctor.
- `src/overview/overview-row.tsx` shows a fixed chip "Doctor n/a" (`messages/en.ts` → `overview.doctor`), the
  baseline of this item; `e2e/overview.spec.ts` asserts it.
- `tests/support/fake-forge-routes.ts` scripts the scan reads; `fakeFetch` rejects unscripted calls, so every scan
  test needs the new routes. `e2e/fake-forge.ts` serves the same reads to the e2e.

## The parity oracle: `portfolio.py --source api` (`@softure-ai/skills` 0.24.0)
- `GET /repos/{slug}/commits/{branch}/check-runs?check_name=context-doctor&filter=latest`; runs named
  `context-doctor`; none → `missing`; the newest by `started_at`; not completed → `pending`; conclusion in
  `success|neutral|skipped` → `ok`, else `failing`.
- Codes of a failing run: `GET /repos/{slug}/check-runs/{id}/annotations`, the annotation titled
  `context-doctor failure codes`, message `code (count), code (count)` (doctor.py `report_to_ci`: codes sorted, each
  with its count). Portfolio keeps only the codes; COCKPIT also keeps the counts (the outcome shows the number of
  failures).

## Access (NFR-5)
- The checks endpoints (list check runs for a ref, list annotations) work only with GitHub App tokens and
  classic tokens; fine-grained personal access tokens cannot be given "Checks" (GitHub docs, REST check runs,
  "Fine-grained access tokens": GitHub App user and installation tokens only). Public repositories answer without
  the permission. NFR-5's fine-grained token (Metadata, Contents, Issues, Pull requests, Actions) is refused on a
  private repository.
- The same result is reachable with Actions: read, which NFR-5 already grants: a GitHub Actions job is a check run
  (same name, status, conclusion). `GET /repos/{slug}/actions/runs/{run_id}/jobs?filter=latest` lists the jobs of a
  run; the runs at the main branch's head are the newest runs CMP-6 already reads (`head_sha`). The annotations
  stay behind Checks, so on this path the failure codes and count are unknown.
- Gap to file: the doctor's failure codes are readable only through the checks API, which a fine-grained token
  cannot reach (SOFTURE/SKILLS; it touches doctor.py's CI report).

## Storage
- `overview.forge_facts` gets `doctor jsonb` and `doctor_status text` (migration `overview/0002`), with the same
  keep-last-good rule as release and runs. Existing rows default to `unavailable` (shown "not read yet").

## Collisions
- No other item is in flight in lane B; `messages/en.ts` gains `overview.doctor*` keys only.
- CMP-8 (release) reads nothing of this item.
