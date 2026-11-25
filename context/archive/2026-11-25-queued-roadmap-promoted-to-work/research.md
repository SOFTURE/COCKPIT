# Research: queued-roadmap-promoted-to-work

- The roadmap view: `app/(app)/projects/[owner]/[name]/roadmaps/[slug]/page.tsx` loads `loadRoadmapView`
  (`src/roadmap/load-roadmap-view.ts`), which knows the target's kind (`active` | `queued`) and slug; items render in
  `src/roadmap/roadmap-view.tsx` (`ItemRow` is a `FoldRow`, whose summary is a `<summary>`: controls do not belong in it).
- The issue write: `ForgeClient.createIssue`, `findIssueLabel` (`cockpit`, else legacy `owner-word`, else none: refuse),
  `listOwnerWordIssues` (both labels, `state=all`). Answers (`src/decisions/answer-entry.ts`) and broadcasts
  (`src/broadcast/send-broadcast.ts`) dedupe with a DB claim plus a body marker; a lost answer is adopted by re-listing.
- Confirm UI pattern: `src/inbox/answer-form.tsx` (pick, then confirm, `useActionState`, server action in
  `app/(app)/inbox/answer/actions.ts`, error codes mapped to dictionary keys).
- Skills 0.37 (`node_modules/@softure-ai/skills/WORKFLOW.md` §5.1): "Taking an entry" = `git mv
  context/backlog/roadmap-<slug>/<id>/change.md context/changes/<id>/backlog-input.md`, then `softure-new <id>`;
  "Promoting a roadmap" = `softure-roadmap --promote <slug>` (archive main, move the file to `roadmap.md`), only when the
  main roadmap is done; the later roadmap "is never promoted as a whole … an item leaves it when the owner raises it".
  So the whole-later issue asks to raise every open item one by one, not to move the file.
- The e2e fake forge lists created issues by label, without a state filter; queued roadmap fixtures exist for
  `example-org/omicron-app` (`omicron-v2`).

## Decisions (auto)
- No DB table: the open issue on the forge is the source of truth (a closed one means the project acted). A per-process
  lock serialises concurrent clicks for the same key (the app runs as one process); a lost create answer is adopted
  by re-listing, as answers do.
- Every queued roadmap gets the buttons, with text per kind (later: raise items; other: `--promote` / take entries),
  since the same need holds and the cost is one branch in the text.
