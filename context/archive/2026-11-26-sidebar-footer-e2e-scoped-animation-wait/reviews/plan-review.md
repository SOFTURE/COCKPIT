# Plan review: sidebar-footer-e2e-scoped-animation-wait

Verdict: approve. One phase, spec only, matches the cause in change.md. The scoped wait keeps what the original wait
was for (the phone sheet's slide is an animation on an ancestor of the footer) and drops what it never needed (the
header). The regression test is deterministic: the progress poll is answered "running" through a route on the test's
own page, so the spinner keeps going whatever other specs do; the scan Refresh queues is one more scan on the shared
database, which every spec already tolerates. No migration, no product code, other threads' specs untouched.
Findings: none.
