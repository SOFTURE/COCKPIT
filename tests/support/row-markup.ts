// Reads one list row's markup the way CT-24's tests need it: how often a text appears, and the parts of the row
// (the left identity, the right column) apart.

/** How many times `text` appears in `markup`, case-insensitively, as plain text (tags and attributes left out). */
export function countText(markup: string, text: string): number {
  const plain = markup.replace(/<[^>]*>/g, " ").toLowerCase();
  return plain.split(text.toLowerCase()).length - 1;
}

/** The markup of the row's part that starts with the element carrying `attribute`, up to the next part. */
export function getRowPart(markup: string, attribute: "data-row-identity" | "data-row-side"): string {
  const start = markup.indexOf(attribute);
  if (start === -1) {
    return "";
  }
  if (attribute === "data-row-identity") {
    const end = markup.indexOf("data-row-side", start);
    return end === -1 ? markup.slice(start) : markup.slice(start, end);
  }
  return markup.slice(start);
}
