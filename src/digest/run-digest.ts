// One digest run (FR-12). A mail still pending from an earlier run is sent first, with the text it was rendered
// with. Otherwise the current snapshot is compared with the last digest's: the first run only records a baseline,
// no change sends nothing, and a change renders one mail that goes to every recipient at most once (the mailing
// module's delivery ledger), as list mail with a one-click unsubscribe.
import { err, ok, type ModuleContext, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { deliverOnce, type DeliveryOutcome } from "@softure-ai/mailing/server";
import { findLatestDigest, findPendingDigest, insertDigest, markDigestSent, type StoredDigest } from "../../modules/digest/digests.ts";
import { getMessages } from "../../messages/index.ts";
import { parseSnapshot, type DigestSnapshot } from "./build-snapshot.ts";
import { compareSnapshots, hasChanges } from "./compare-snapshots.ts";
import type { DigestSettings } from "./digest-settings.ts";
import { loadSnapshot } from "./load-snapshot.ts";
import { renderDigest } from "./render-digest.ts";

/** The list-mail kind of the digest: an unsubscribe from it is honoured by the mailing module. */
export const DIGEST_MAIL_KIND = "digest";

/** How long to wait when the provider asks for patience without saying how long. */
export const DEFAULT_RETRY_SECONDS = 300;

export type DigestRun =
  | { readonly kind: "baseline" }
  | { readonly kind: "unchanged" }
  | { readonly kind: "quiet" }
  | { readonly kind: "sent"; readonly digestId: number }
  | { readonly kind: "retry_later"; readonly seconds: number }
  | { readonly kind: "uncertain" };

export type DigestContext = ModuleContext<Queryable>;

type RunError = "digest.read_failed" | "digest.write_failed";

/** Key order of stored JSON is the database's, so snapshots are compared with sorted keys. */
function toComparable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toComparable);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, toComparable(entry)]),
    );
  }
  return value;
}

function isSameSnapshot(left: DigestSnapshot, right: DigestSnapshot): boolean {
  return JSON.stringify(toComparable(left)) === JSON.stringify(toComparable(right));
}

function getRetrySeconds(outcome: DeliveryOutcome): number | null {
  if (outcome.status === "retry-later" || outcome.status === "halted") {
    return outcome.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS;
  }
  // Another sender holds the claim; it is taken over once stale (15 minutes).
  return outcome.status === "in-flight" ? DEFAULT_RETRY_SECONDS * 3 : null;
}

async function sendPending(context: DigestContext, digest: StoredDigest, settings: DigestSettings): Promise<Result<DigestRun, RunError>> {
  if (digest.mail === null) {
    return err("digest.read_failed");
  }
  let retrySeconds: number | null = null;
  let isUncertain = false;
  for (const to of settings.recipients) {
    const outcome = await deliverOnce(
      context,
      { scope: `digest.mail:${String(digest.id)}`, mail: { to, kind: DIGEST_MAIL_KIND, ...digest.mail } },
      // The job's queue decides how often to retry; the ledger never closes a delivery for an outage.
      { maxAttempts: null },
    );
    const seconds = getRetrySeconds(outcome);
    if (seconds !== null) {
      retrySeconds = Math.max(retrySeconds ?? 0, seconds);
    }
    isUncertain ||= outcome.status === "uncertain";
  }
  if (retrySeconds !== null) {
    return ok({ kind: "retry_later", seconds: retrySeconds });
  }
  if (isUncertain) {
    return ok({ kind: "uncertain" });
  }
  const marked = await markDigestSent(context.db, digest.id, context.clock.now());
  return marked.ok ? ok({ kind: "sent", digestId: digest.id }) : err("digest.write_failed");
}

export async function runDigest(context: DigestContext, settings: DigestSettings): Promise<Result<DigestRun, RunError>> {
  const pending = await findPendingDigest(context.db);
  if (!pending.ok) {
    return err("digest.read_failed");
  }
  if (pending.value !== null) {
    return sendPending(context, pending.value, settings);
  }
  const [latest, current] = await Promise.all([findLatestDigest(context.db), loadSnapshot(context.db, context.clock.now(), context.config.timezone)]);
  if (!latest.ok || !current.ok) {
    return err("digest.read_failed");
  }
  const createdAt = context.clock.now();
  const previous = latest.value === null ? null : parseSnapshot(latest.value.snapshot);
  if (previous === null) {
    const inserted = await insertDigest(context.db, { status: "baseline", snapshot: current.value, createdAt });
    return inserted.ok ? ok({ kind: "baseline" }) : err("digest.write_failed");
  }
  const changes = compareSnapshots(previous, current.value);
  if (!hasChanges(changes)) {
    if (isSameSnapshot(previous, current.value)) {
      return ok({ kind: "unchanged" });
    }
    const inserted = await insertDigest(context.db, { status: "quiet", snapshot: current.value, createdAt });
    return inserted.ok ? ok({ kind: "quiet" }) : err("digest.write_failed");
  }
  const mail = renderDigest({ changes, appOrigin: context.config.appOrigin, messages: getMessages(context.config.locale) });
  const inserted = await insertDigest(context.db, { status: "pending", snapshot: current.value, mail, createdAt });
  if (!inserted.ok) {
    // Another run holds a pending digest: it sends it.
    return inserted.error === "digest.pending_exists" ? ok({ kind: "retry_later", seconds: DEFAULT_RETRY_SECONDS }) : err("digest.write_failed");
  }
  return sendPending(context, inserted.value, settings);
}
