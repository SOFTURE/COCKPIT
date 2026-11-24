// The wording of one context drift (CT-3), shared by the overview chip and the project page's notice.
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ContextDrift } from "./find-context-drift.ts";

type Copy = AppMessages["drift"];

export interface DriftText {
  readonly title: string;
  readonly detail: string;
  /** The step that settles it in the project. */
  readonly fix: string;
}

export function describeDrift(copy: Copy, drift: ContextDrift): DriftText {
  switch (drift.kind) {
    case "release_not_settled":
      return {
        title: fillMessage(copy.releaseNotSettled, { version: drift.version }),
        detail: fillMessage(copy.releaseNotSettledDetail, { version: drift.version, date: drift.date, items: drift.items.join(", ") }),
        fix: fillMessage(copy.releaseNotSettledFix, { version: drift.version }),
      };
    case "finished_roadmap_live":
      return {
        title: copy.finishedRoadmapLive,
        detail: fillMessage(copy.finishedRoadmapLiveDetail, { slug: drift.slug ?? "?", total: drift.total }),
        fix: copy.finishedRoadmapLiveFix,
      };
  }
}
