# Implementation review: sidebar-footer-e2e-scoped-animation-wait

Verdict: approve. Spec only, as planned: `waitForFooterAnimations` waits for animations on the footer, its ancestors
and its descendants, so the phone sheet's slide is still waited for and the header's spinner is not. The new test
routes the progress poll before signing in (no real poll can stop the spinner first) and forces the Refresh press,
because a scan another spec started may already have disabled the button; the first full run caught exactly that, and
the forced press keeps the test deterministic either way. No retry, no loosened assertion, no product change; other
threads' specs untouched. Findings: none.
