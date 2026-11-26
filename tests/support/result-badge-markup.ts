// Reads theme-notion's result badges (CT-28) out of rendered markup: each badge's attributes, its icon and its word,
// so a test checks tone, colour, icon, word, hover title and the caller's own `data-*` attribute without depending on
// the order in which the theme writes its attributes.

export interface ResultBadgeFacts {
  /** Every attribute on the badge element: `data-slot`, `data-tone`, `data-color`, `title`, the caller's `data-*`. */
  readonly attributes: Readonly<Record<string, string>>;
  /** The lucide icon's name (`circle-check`), or null when the badge draws none. */
  readonly icon: string | null;
  /** The visible word, as plain text. */
  readonly word: string;
  readonly isSpinning: boolean;
}

const BADGE = /<span data-slot="result-badge"([^>]*)>(.*?)<span data-slot="result-badge-label"[^>]*>(.*?)<\/span><\/span>/g;

function decode(text: string): string {
  return text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function readAttributes(text: string): Record<string, string> {
  const attributes: Record<string, string> = { "data-slot": "result-badge" };
  for (const match of text.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
    attributes[match[1] ?? ""] = decode(match[2] ?? "");
  }
  return attributes;
}

/** Every result badge in `markup`, in document order. */
export function getResultBadges(markup: string): readonly ResultBadgeFacts[] {
  return [...markup.matchAll(BADGE)].map((match) => {
    const icon = /class="lucide lucide-([a-z0-9-]+)/.exec(match[2] ?? "");
    return {
      attributes: readAttributes(match[1] ?? ""),
      icon: icon?.[1] ?? null,
      word: decode((match[3] ?? "").replace(/<[^>]*>/g, "")),
      isSpinning: (match[2] ?? "").includes("animate-spin"),
    };
  });
}

/** The one result badge carrying `attribute` (with `value` when given); throws when there is not exactly one. */
export function getResultBadge(markup: string, attribute: string, value?: string): ResultBadgeFacts {
  const found = getResultBadges(markup).filter((badge) => (value === undefined ? attribute in badge.attributes : badge.attributes[attribute] === value));
  if (found.length !== 1) {
    throw new Error(`Expected one result badge with ${attribute}${value === undefined ? "" : `="${value}"`}, found ${String(found.length)}`);
  }
  // The length check above guarantees the first entry.
  return found[0] as ResultBadgeFacts;
}
