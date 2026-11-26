# Implementation review: release-gap-job-schedules

Verdict: approved (auto).

- Drift: none; one test added to `tests/config.test.ts`.
- Evidence: 11/11 in the file on master; with `[SCHEDULED_TASK_QUEUE]: { every: "5m" }` and with the line removed the
  new test fails (1 failed, 10 passed), so it pins the schedule.
- The queue options are matched with `toMatchObject`, since the jobs module adds its default backoff.
