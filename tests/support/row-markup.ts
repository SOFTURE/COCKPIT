// Reads one list row's markup the way CT-24's tests need it: how often a text appears, and the parts of the theme's
// `ListEntry` (the left identity, the right column) apart (CT-26).

/** How many times `text` appears in `markup`, case-insensitively, as plain text (tags and attributes left out). */
export function countText(markup: string, text: string): number {
  const plain = markup.replace(/<[^>]*>/g, " ").toLowerCase();
  return plain.split(text.toLowerCase()).length - 1;
}

const IDENTITY = 'data-slot="list-entry-identity"';
const SIDE = 'data-slot="list-entry-side"';

/** The markup of the row's identity (up to the right column) or of its right column (to the end). */
export function getRowPart(markup: string, part: "identity" | "side"): string {
  const start = markup.indexOf(part === "identity" ? IDENTITY : SIDE);
  if (start === -1) {
    return "";
  }
  if (part === "identity") {
    const end = markup.indexOf(SIDE, start);
    return end === -1 ? markup.slice(start) : markup.slice(start, end);
  }
  return markup.slice(start);
}
