// What the broadcast pages show (CV-1): each project's send as sending, sent (issue link), done (the issue is closed in
// the scan's stored owner-word issues) or failed (its reason), with what wakes each project on its issue (CV-2). No
// forge call: "done" and the wake-up follow the scan.
import { z } from "zod";
import type { StoredBroadcast, StoredSend } from "../../modules/projects/broadcasts.ts";
import type { StoredAdapterRead } from "../../modules/adapters/reads.ts";
import { getWakeView, type WakeView } from "../adapters/wake/wake-view.ts";
import type { SendFailure } from "./send-broadcast.ts";

export type SendState = "sending" | "sent" | "done" | "failed";

export interface SendView {
  readonly key: string;
  readonly fullName: string;
  readonly state: SendState;
  readonly issueNumber: number | null;
  readonly issueUrl: string | null;
  readonly failure: SendFailure | null;
  /** What wakes the project on the issue (CV-2); `none` when it has no workflow file. */
  readonly wake: WakeView;
}

export interface BroadcastView {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly sentByName: string | null;
  readonly createdAt: Date;
  readonly sends: readonly SendView[];
  readonly counts: Readonly<Record<SendState, number>>;
}

/** The scan's stored issues of one project, as far as this page needs them. */
export interface ProjectIssues {
  readonly key: string;
  readonly issues: unknown;
}

const SEND_FAILURES = ["label_missing", "forge_refused", "forge_unauthorized", "forge_rate_limited", "forge_unavailable"] as const;
const storedIssueSchema = z.object({ number: z.number(), state: z.enum(["open", "closed"]) });

function getClosedIssues(issues: unknown): Set<number> {
  const parsed = z.array(z.unknown()).safeParse(issues);
  if (!parsed.success) {
    return new Set();
  }
  return new Set(
    parsed.data.flatMap((value) => {
      const issue = storedIssueSchema.safeParse(value);
      return issue.success && issue.data.state === "closed" ? [issue.data.number] : [];
    }),
  );
}

function toFailure(failure: string | null): SendFailure | null {
  if (failure === null) {
    return null;
  }
  // A reason this version does not know reads as the forge not answering.
  return SEND_FAILURES.find((known) => known === failure) ?? "forge_unavailable";
}

function toSendView(send: StoredSend, closed: ReadonlySet<number>, adapterReads: readonly StoredAdapterRead[]): SendView {
  let state: SendState;
  if (send.status === "sent") {
    state = send.issueNumber !== null && closed.has(send.issueNumber) ? "done" : "sent";
  } else {
    state = send.status === "failed" ? "failed" : "sending";
  }
  return {
    key: send.repositoryKey,
    fullName: send.fullName,
    state,
    issueNumber: send.issueNumber,
    issueUrl: send.issueUrl,
    failure: send.status === "failed" ? toFailure(send.failure) : null,
    wake: getWakeView(adapterReads, send.repositoryKey),
  };
}

export function buildBroadcastView(
  broadcast: StoredBroadcast,
  sends: readonly StoredSend[],
  projects: readonly ProjectIssues[],
  adapterReads: readonly StoredAdapterRead[] = [],
): BroadcastView {
  const closedByKey = new Map(projects.map((project) => [project.key, getClosedIssues(project.issues)]));
  const views = sends
    .filter((send) => send.broadcastId === broadcast.id)
    .map((send) => toSendView(send, closedByKey.get(send.repositoryKey) ?? new Set(), adapterReads));
  const counts: Record<SendState, number> = { sending: 0, sent: 0, done: 0, failed: 0 };
  for (const view of views) {
    counts[view.state] += 1;
  }
  return {
    id: broadcast.id,
    title: broadcast.title,
    body: broadcast.body,
    sentByName: broadcast.sentByName,
    createdAt: broadcast.createdAt,
    sends: views,
    counts,
  };
}
