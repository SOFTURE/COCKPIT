// A fictional, valid `context/state.json` (schema version 2) for tests.
import type { ProjectState } from "../../src/state/state-schema.ts";

export function createStateFixture(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    schema_version: 2,
    project: "alpha-app",
    mode: "autonomous",
    main_branch: "main",
    updated_at: "2026-11-01T10:00:00Z",
    active_roadmap: {
      slug: "alpha-v1",
      title: "Alpha v1",
      status: "ready",
      version: "1",
      path: "context/foundation/roadmap.md",
      done: 1,
      total: 3,
      items: [
        { id: "AL-1", change_id: "first-screen", outcome: "the first screen", status: "done", stage: null, since: null, detail: null, prerequisites: [], mode: "autonomous" },
      ],
    },
    queued: [],
    open_changes: [],
    owner_queue: [
      { id: "oq-1a2b3c", kind: "decision", source: "context/foundation/roadmap.md", item: "AL-2", since: "2026-10-30", text: "Pick the mail provider" },
    ],
    last_release: null,
    ...overrides,
  };
}
