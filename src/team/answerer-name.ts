// Who gave an answer, as people read it (FR-16): the in-app name and the shorter form an owner-word issue carries.
// An issue can sit in a public repository, so it never carries a full email address.

export interface Answerer {
  readonly email: string;
  readonly displayName?: string | null;
}

/** The answerer's display name, else their email: what the inbox and the history show. */
export function getAnswererName(answerer: Answerer): string {
  const displayName = answerer.displayName?.trim() ?? "";
  return displayName === "" ? answerer.email : displayName;
}

/** The name an owner-word issue carries: a stored email becomes the part before `@`. */
export function getPublicAnswererName(name: string): string {
  const trimmed = name.trim();
  const at = trimmed.indexOf("@");
  return at <= 0 ? trimmed : trimmed.slice(0, at);
}
