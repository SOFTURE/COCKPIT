# Changelog

Releases are cut by the `release` workflow as date tags (`vYYYY.MM.DD`); each GitHub Release carries its generated
notes. This file lists what each version of the app brings.

## 0.1.0 (unreleased)

The first usable slice: one place to see every watched project and answer what waits for the owner.

- **Sign-in and shell:** the owner signs in with the account the operator created; nobody can sign up (CMP-1).
- **Watched repositories:** the owner adds and removes repositories on the Settings screen, checked against the forge
  token (CMP-2).
- **Scan:** every project's `context/state.json` and forge facts are read on a schedule and on demand (CMP-3).
- **Inbox:** every owner-queue entry of every project in one list, oldest first (CMP-4).
- **Answers:** Yes, No or Later with a note becomes one owner-word issue in the project; the entry shows sent, then
  done (CMP-5).
- **Overview:** one row per project, grouped by status, with roadmap progress, queued roadmaps, open changes, waiting
  entries, release, CI and quality review (CMP-6), and the `context-doctor` result (CMP-7).
- **Deploy:** the production image and stack on the host's shared edge, the deploy and release workflows, the build
  info route and a deploy dry run in CI (CMP-8).
