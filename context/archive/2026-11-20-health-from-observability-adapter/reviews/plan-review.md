# Plan review: health-from-observability-adapter

Reviewed against change.md, research.md, the PRD (FR-8, FR-17, NFR-2, NFR-5, NFR-6) and the code on master 18683e6.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | Every scan test scripts its forge answers exactly (`fakeFetch` rejects unscripted calls); a new rules-file read would fail them all. | Fix: the scan runs only the adapters it is given (none by default); the job handler passes the observability adapter, which makes no call while Grafana is not configured. |
| 2 | WARNING | The project page is rewritten by CMP-9 in parallel; a large edit there conflicts. | Fix: the health block is one self-contained component; the page gets one line, merged with CMP-9 at merge time. |
| 3 | WARNING | Grafana before 11.4 ignores `folder_uid` and returns every rule of the instance. | Applied: the client filters by folder uid and rule uids itself. |
| 4 | SUGGESTION | The token must never reach logs or pages (NFR-6). | Applied: failures carry codes and the status only (`requestJson` never prints the URL or headers); tested that the reason holds no token. |
| 5 | SUGGESTION | Production cannot use the adapter until compose passes the variables. | Recorded: CMP-23 (release item of this slice, lane R) wires them; noted in Decisions (auto) and in CMP-23's change. |

Verdict: ready to implement after the fixes above (applied to the plan).
