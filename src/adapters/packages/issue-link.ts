// The web link of a held package's issue as the routine writes it (`SOFTURE/AI#123`), from the forge's web origin.
// `#12` or `12` names an issue of the project itself; an http(s) URL is kept; anything else has no link.

export function getIssueLink(issue: string, webUrl: string, projectFullName: string): string | null {
  const text = issue.trim();
  if (/^https?:\/\/\S+$/i.test(text)) {
    return text;
  }
  const origin = webUrl.replace(/\/+$/, "");
  const other = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)#(\d+)$/.exec(text);
  if (other !== null) {
    return `${origin}/${other[1] ?? ""}/${other[2] ?? ""}/issues/${other[3] ?? ""}`;
  }
  const own = /^#?(\d+)$/.exec(text);
  return own === null ? null : `${origin}/${projectFullName}/issues/${own[1] ?? ""}`;
}
