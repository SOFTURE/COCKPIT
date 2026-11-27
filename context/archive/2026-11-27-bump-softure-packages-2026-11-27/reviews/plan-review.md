# Plan review: bump-softure-packages-2026-11-27

Verdict: approve (auto). The plan covers every migration step the two changelogs ask of this app: the 0.41.0 dialog
migration and the deploy pins. The optional `sideLayout`/`DatePicker` adoption is out of scope by the owner's standing
order and named in `change.md`; the 0.41.1 arrow rule stays because the app's one-line column is its own CSS, not
the theme's `sideLayout`, so the theme's new centring does not cover it. No findings.
