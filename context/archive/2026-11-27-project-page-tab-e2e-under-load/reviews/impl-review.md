# Implementation review: project-page-tab-e2e-under-load

Verdict: approve. Spec only, as planned. `openTab` reads the tab's own `href` and waits for exactly that path and query
with `waitUntil: "load"`, so it cannot resolve on the page being left, and the `aria-current` check now runs on the
loaded document; the navigation is bounded by the test's 30-second budget, not by the 5-second expect. The
`beforeEach` hold of `/api/scan-progress` covers every page of the context, including the one the breadcrumb opens.
No retry, no loosened assertion, no product change. The one 4-worker failure seen locally is another spec
(packages.spec, filed as SOFTURE/COCKPIT#169, its own change). Findings: none.
