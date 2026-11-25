// The cockpit issues COCKPIT creates: the one an answer becomes (FR-5, WORKFLOW §8.6) and the one a broadcast
// becomes in each chosen project (CV-1), and the one that promotes a queued roadmap or one of its items to work. Each is prose a person reads, plus the marker the project's coordinator and
// COCKPIT read. It names who answered (FR-16) by display name or the part of the email before
// `@`, never a full address: the issue lives in the project's repository, which may be public.
import { formatBroadcastMarker } from "../broadcast/broadcast-marker.ts";
import { formatPromotionMarker } from "../roadmap/promotion-marker.ts";
import { getPublicAnswererName } from "../team/answerer-name.ts";
import { formatAnswerMarker, type Answer } from "../inbox/answer-marker.ts";
import type { OwnerQueueEntry } from "../state/state-schema.ts";
import type { NewForgeIssue } from "./client.ts";
import { ISSUE_LABEL } from "./issue-label.ts";

const ANSWER_WORDS: Readonly<Record<Answer, string>> = { yes: "Yes", no: "No", later: "Later" };

/** A step or a secret is something to do: its yes reads "Done" (the marker still says yes). */
function getAnswerWord(entry: OwnerQueueEntry, answer: Answer): string {
  return answer === "yes" && (entry.kind === "step" || entry.kind === "secret") ? "Done" : ANSWER_WORDS[answer];
}

/** Where the package-update routine records its owner work (routines/package-updates.md, SOFTURE/SKILLS#86). */
const ROUTINE_OWNER_STEPS_SOURCE = "context/workflow.json#routines.packageUpdates.ownerSteps";
const ROUTINE_HOLD_SOURCE = "context/workflow.json#routines.packageUpdates.hold";

/** Issue titles stay readable in a list; the full entry text is in the body. */
const TITLE_TEXT_LIMIT = 72;
/** Every issue COCKPIT opens is a cockpit command (`routines/cockpit-command.md` of @softure-ai/skills). */
export const ISSUE_TITLE_PREFIX = "COCKPIT command: ";
/** The closing line of every issue body, naming the cockpit command before its marker. */
const SENT_FROM = "Sent from COCKPIT as a cockpit command: act on it as AGENTS.md says for cockpit issues.";

function shorten(text: string, limit: number): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length <= limit ? line : `${line.slice(0, limit - 3).trimEnd()}...`;
}

/** Quoted text is the project's or the owner's; an HTML comment in it could pass for the issue's own marker. */
function quote(text: string): string {
  return text
    .replaceAll("<!--", "&lt;!--")
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

export interface AnswerIssueInput {
  readonly entry: OwnerQueueEntry;
  readonly answer: Answer;
  readonly note: string | null;
  /** The answerer's stored name (display name or email); null when it is not known. */
  readonly answeredBy: string | null;
}

/** Names in the issue are plain text: no markdown or HTML a name could smuggle in. */
function toPlainName(name: string): string {
  return name.replace(/[<>*_`[\]\\]/g, "").trim();
}

/**
 * What the project does with the answer (WORKFLOW §8.6, SOFTURE/SKILLS 0.37.0), so any session that picks the issue up
 * closes the loop: whatever the answer, the entry leaves the project's owner queue, and COCKPIT lists it until the
 * project's `context/state.json` no longer does. Re-wording the entry instead would show it to the owner again.
 */
function getSettleSteps(entry: OwnerQueueEntry): string[] {
  if (entry.source === ROUTINE_OWNER_STEPS_SOURCE) {
    return [
      `For the project: settle entry \`${entry.id}\`, an owner step of a package bump in \`context/workflow.json\` (\`routines.packageUpdates.ownerSteps\`), citing this issue:`,
      "",
      '- done: set `"confirmed": "#<this issue>"` on that `ownerSteps` entry (the next package-update run removes it);',
      "- no: record what follows for the bump, then set `confirmed` with this issue so the step leaves the queue;",
      "- later: leave it without `confirmed`; it stays in the queue.",
      "",
      "Then regenerate `context/state.json` in the same commit, comment what was done and close this issue. COCKPIT drops the entry from the owner's list once the project's state no longer lists it.",
    ];
  }
  if (entry.source === ROUTINE_HOLD_SOURCE) {
    return [
      `For the project: entry \`${entry.id}\` is a package the nightly update holds for the owner's decision (\`routines.packageUpdates.hold\` in \`context/workflow.json\`).`,
      "",
      "- yes or no: record it on the hold's issue named in the entry; the next package-update run applies this answer to the held package and removes the hold;",
      "- later: leave the hold as it is.",
      "",
      "Then comment what was done and close this issue. COCKPIT drops the entry from the owner's list once the project's state no longer lists it.",
    ];
  }
  return [
    `For the project: settle entry \`${entry.id}\` in \`${entry.source}\`, citing this issue, so it leaves the owner queue:`,
    "",
    "- yes: carry it out and tick it `— done: #<this issue>`; what only the owner can still do becomes a new item of `context/foundation/roadmaps/roadmap-later.md`;",
    "- no: tick it `— declined: #<this issue>` and record what follows;",
    "- later: move the item to `context/foundation/roadmaps/roadmap-later.md` as a new item with the next number of that roadmap's own prefix (its backlog entry moves with it), mark the old row `carried (to roadmaps/roadmap-later.md <new ID>, #<this issue>)` and tick the entry `— later: #<this issue> → <new ID>`.",
    "",
    "Never re-word the entry in place: the owner has decided, and a changed entry would be shown to them again.",
    "Then regenerate `context/state.json` in the same commit, comment what was done and close this issue. COCKPIT drops the entry from the owner's list once the project's state no longer lists it.",
  ];
}

export function formatAnswerIssue({ entry, answer, note, answeredBy }: AnswerIssueInput): NewForgeIssue {
  const word = getAnswerWord(entry, answer);
  const name = answeredBy === null ? "" : toPlainName(getPublicAnswererName(answeredBy));
  const who = name === "" ? "The owner" : `**${name}**`;
  const lines = [
    `${who} answers **${word}** to this entry of the owner queue:`,
    "",
    quote(entry.text),
    "",
    `- Entry: \`${entry.id}\``,
    `- Kind: ${entry.kind}`,
    `- Source: \`${entry.source}\``,
  ];
  if (entry.item !== null) {
    lines.push(`- Item: ${entry.item}`);
  }
  lines.push(`- Answer: ${word}`);
  if (name !== "") {
    lines.push(`- Answered by: ${name}`);
  }
  if (note !== null) {
    lines.push("", name === "" ? "Note from the owner:" : `Note from ${name}:`, "", quote(note));
  }
  lines.push("", ...getSettleSteps(entry), "", SENT_FROM, "", formatAnswerMarker({ entry: entry.id, answer }));
  return {
    title: `${ISSUE_TITLE_PREFIX}${word}, ${shorten(entry.text, TITLE_TEXT_LIMIT)}`,
    body: lines.join("\n"),
    labels: [ISSUE_LABEL],
  };
}

export interface BroadcastIssueInput {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  /** The sender's stored name (display name or email); null when it is not known. */
  readonly sentBy: string | null;
}

/** One broadcast as a cockpit issue: the owner's word to the whole project, quoted, with the broadcast's marker. */
export function formatBroadcastIssue({ id, title, body, sentBy }: BroadcastIssueInput): NewForgeIssue {
  const name = sentBy === null ? "" : toPlainName(getPublicAnswererName(sentBy));
  const who = name === "" ? "The owner" : `**${name}**`;
  const lines = [
    `${who} sends this cockpit command to the project:`,
    "",
    quote(body),
    "",
    `- Broadcast: \`${id}\``,
  ];
  if (name !== "") {
    lines.push(`- Sent by: ${name}`);
  }
  lines.push(
    "",
    "Act on it as AGENTS.md says for cockpit issues, then close this issue: COCKPIT shows the project as done once it is closed.",
    "",
    SENT_FROM,
    "",
    formatBroadcastMarker({ id }),
  );
  return {
    title: `${ISSUE_TITLE_PREFIX}${shorten(title, TITLE_TEXT_LIMIT)}`,
    body: lines.join("\n"),
    labels: [ISSUE_LABEL],
  };
}

/** The slug of the later roadmap: what the owner put off, raised item by item and never promoted as a file (WORKFLOW §5.1). */
export const LATER_ROADMAP_SLUG = "later";

export interface PromotedItem {
  readonly id: string;
  readonly title: string | null;
  readonly outcome: string | null;
  readonly changeId: string | null;
}

export interface PromotionIssueInput {
  readonly roadmap: { readonly slug: string; readonly path: string; readonly title: string };
  /** The one item promoted; null promotes the whole roadmap. */
  readonly item: PromotedItem | null;
  /** The roadmap's open items: listed when the whole roadmap is promoted. */
  readonly openItems: readonly PromotedItem[];
  /** The requester's stored name (display name or email); null when it is not known. */
  readonly requestedBy: string | null;
}

function describeItem(item: PromotedItem): string {
  const title = item.title ?? item.outcome ?? "";
  return title === "" ? `**${item.id}**` : `**${item.id}** ${title.replace(/\s+/g, " ").replaceAll("<!--", "&lt;!--").trim()}`;
}

/** How the project raises one item into the main roadmap (WORKFLOW §5.1 "Taking an entry"; the later roadmap's own rule). */
function getRaiseSteps(slug: string, path: string, subject: string): string[] {
  return [
    `1. Add ${subject} to the main roadmap \`context/foundation/roadmap.md\` as a new item with the next ID of that roadmap's own prefix (\`softure-roadmap --revise\`; create the main roadmap first when there is none), with its outcome, prerequisites and size. It keeps no ID of \`${path}\`.`,
    `2. Take its backlog entry when it has one: \`git mv context/backlog/roadmap-${slug}/<change-id>/change.md context/changes/<change-id>/backlog-input.md\`, then \`softure-new <change-id>\`.`,
    `3. Mark its row in \`${path}\` \`carried (to roadmap.md <new ID>, #<this issue>)\`. What it still waits for (an owner step, data, a date) goes with it as its prerequisite or owner step: the owner has raised it, so it is not left behind.`,
    "4. Regenerate `context/state.json` in the same commit, then run it like any other item: one item, one change, one thread.",
  ];
}

/**
 * A queued roadmap, or one of its items, promoted to work: the owner's word for the project's coordinator, with the
 * SOFTURE steps it takes (WORKFLOW §5.1). The later roadmap is raised item by item and never moved as a file; another
 * queued roadmap is promoted with `softure-roadmap --promote <slug>`.
 */
export function formatPromotionIssue({ roadmap, item, openItems, requestedBy }: PromotionIssueInput): NewForgeIssue {
  const name = requestedBy === null ? "" : toPlainName(getPublicAnswererName(requestedBy));
  const who = name === "" ? "The owner" : `**${name}**`;
  const isLater = roadmap.slug === LATER_ROADMAP_SLUG;
  const roadmapName = isLater ? "the later roadmap" : `the queued roadmap \`${roadmap.slug}\``;
  const lines: string[] = [];
  if (item !== null) {
    lines.push(`${who} promotes **${item.id}** of ${roadmapName} (\`${roadmap.path}\`) to work now:`, "", quote([item.title, item.outcome].filter((text) => text !== null && text !== "").join("\n\n") || item.id), "");
    lines.push(`- Roadmap: \`${roadmap.slug}\` (\`${roadmap.path}\`)`, `- Item: ${item.id}`);
    if (item.changeId !== null) {
      lines.push(`- Change ID: \`${item.changeId}\``);
    }
  } else {
    lines.push(`${who} promotes the whole of ${roadmapName} (\`${roadmap.path}\`) to work now. Its open items:`, "");
    lines.push(...(openItems.length === 0 ? ["- (none listed when this was sent)"] : openItems.map((open) => `- ${describeItem(open)}`)), "");
    lines.push(`- Roadmap: \`${roadmap.slug}\` (\`${roadmap.path}\`)`);
  }
  if (name !== "") {
    lines.push(`- Requested by: ${name}`);
  }
  lines.push("");
  if (item !== null) {
    lines.push("For the project: raise this item into the main roadmap (WORKFLOW §5.1):", "", ...getRaiseSteps(roadmap.slug, roadmap.path, "the item"));
  } else if (isLater) {
    lines.push(
      "For the project: the later roadmap is never promoted as a file (WORKFLOW §5.1), so raise every open item listed above into the main roadmap, in this roadmap's order, each like this:",
      "",
      ...getRaiseSteps(roadmap.slug, roadmap.path, "the item"),
      "",
      "`roadmaps/roadmap-later.md` stays, with the raised rows carried.",
    );
  } else {
    lines.push(
      "For the project: this is the owner's word to promote the roadmap (WORKFLOW §5.1):",
      "",
      `1. Run \`softure-roadmap --promote ${roadmap.slug}\`: the main roadmap is closed first (WORKFLOW §5.2, open rows carried), \`${roadmap.path}\` becomes \`context/foundation/roadmap.md\` with \`status: ready\`.`,
      `2. Take its ready entries from \`context/backlog/roadmap-${roadmap.slug}/\` as WORKFLOW §5.1 says, and start the run: one item, one change, one thread.`,
      "3. Regenerate `context/state.json` in the same commit.",
      "",
      "When the main roadmap cannot be closed yet, raise the open items into it instead, each like this:",
      "",
      ...getRaiseSteps(roadmap.slug, roadmap.path, "the item"),
    );
  }
  lines.push("", "Then comment what was done (the new IDs, the pull request) and close this issue.", "", SENT_FROM, "", formatPromotionMarker({ roadmap: roadmap.slug, item: item?.id ?? null }));
  const subject = item !== null ? `promote ${item.id} to work, ${shorten(item.title ?? item.outcome ?? roadmap.slug, TITLE_TEXT_LIMIT)}` : `promote the whole ${isLater ? "later roadmap" : `roadmap ${roadmap.slug}`} to work`;
  return { title: `${ISSUE_TITLE_PREFIX}${subject}`, body: lines.join("\n"), labels: [ISSUE_LABEL] };
}
