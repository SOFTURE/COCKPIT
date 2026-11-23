// The digest mail (FR-12): a subject with the count of changes and a text and an HTML body with the three sections
// (shipped, waits for you, broke), each line linking into COCKPIT. Text from watched repositories is escaped in the
// HTML; the subject carries no repository text. The unsubscribe footer is added by the mailing module.
import type { DigestMail } from "../../modules/digest/digests.ts";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { DigestChanges } from "./compare-snapshots.ts";

interface DigestLine {
  readonly text: string;
  readonly url: string;
  readonly linkLabel: string;
}

interface DigestSection {
  readonly title: string;
  readonly lines: readonly DigestLine[];
}

export interface RenderDigestInput {
  readonly changes: DigestChanges;
  readonly appOrigin: string;
  readonly messages: AppMessages;
}

/** The project page of `owner/name` on `appOrigin`. */
export function getProjectUrl(appOrigin: string, projectName: string): string {
  const [owner = "", name = ""] = projectName.split("/");
  return new URL(`/projects/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, appOrigin).toString();
}

function buildSections({ changes, appOrigin, messages }: RenderDigestInput): DigestSection[] {
  const copy = messages.digest;
  const inboxUrl = new URL("/inbox", appOrigin).toString();
  const sections: DigestSection[] = [
    {
      title: copy.shipped,
      lines: changes.shipped.map((line) => ({
        text:
          line.kind === "release"
            ? fillMessage(copy.shippedRelease, { project: line.projectName, version: line.version })
            : line.outcome === null
              ? fillMessage(copy.shippedItemNoOutcome, { project: line.projectName, item: line.itemId })
              : fillMessage(copy.shippedItem, { project: line.projectName, item: line.itemId, outcome: line.outcome }),
        url: getProjectUrl(appOrigin, line.projectName),
        linkLabel: copy.openProject,
      })),
    },
    {
      title: copy.waiting,
      lines: changes.waiting.map((line) => ({
        text: fillMessage(copy.waitingEntry, { project: line.projectName, text: line.text }),
        url: inboxUrl,
        linkLabel: copy.openInbox,
      })),
    },
    {
      title: copy.broke,
      lines: changes.broke.map((line) => ({
        text: fillMessage(copy.brokeLine, {
          project: line.projectName,
          reasons: line.reasons.map((reason) => copy.brokenReasons[reason]).join("; "),
        }),
        url: getProjectUrl(appOrigin, line.projectName),
        linkLabel: copy.openProject,
      })),
    },
  ];
  return sections.filter((section) => section.lines.length > 0);
}

const HTML_ESCAPES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

function renderText(intro: string, sections: readonly DigestSection[]): string {
  const blocks = sections.map((section) => [section.title, ...section.lines.map((line) => `- ${line.text}\n  ${line.url}`)].join("\n"));
  return [intro, ...blocks].join("\n\n");
}

function renderHtml(intro: string, sections: readonly DigestSection[]): string {
  const blocks = sections.map(
    (section) =>
      `<h2>${escapeHtml(section.title)}</h2>\n<ul>\n${section.lines
        .map((line) => `<li>${escapeHtml(line.text)} <a href="${escapeHtml(line.url)}">${escapeHtml(line.linkLabel)}</a></li>`)
        .join("\n")}\n</ul>`,
  );
  return [`<p>${escapeHtml(intro)}</p>`, ...blocks].join("\n");
}

export function renderDigest(input: RenderDigestInput): DigestMail {
  const copy = input.messages.digest;
  const sections = buildSections(input);
  const count = sections.reduce((total, section) => total + section.lines.length, 0);
  return {
    subject: count === 1 ? copy.subjectOne : fillMessage(copy.subject, { count }),
    text: renderText(copy.intro, sections),
    html: renderHtml(copy.intro, sections),
  };
}
