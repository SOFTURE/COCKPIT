// Where the MCP tools read from: the same inbox and overview the screens build, so both answer the same values.
import type { Inbox } from "../inbox/build-inbox.ts";
import type { Overview } from "../overview/build-overview.ts";

export interface CockpitReader {
  readonly readInbox: () => Promise<Inbox>;
  /** The overview counts unanswered entries from the inbox, as the screen does. */
  readonly readOverview: (inbox: Inbox) => Promise<Overview>;
}
