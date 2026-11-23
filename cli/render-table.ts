// Plain text tables for the terminal: padded columns, and no control character from repository text reaches it.

// C0 and C1 control characters, DEL included: an ANSI escape in an entry's text must not drive the terminal.
// eslint-disable-next-line no-control-regex -- matching control characters is the point.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

/** The text on one line with every control character replaced by a space. */
export function toCellText(value: string): string {
  return value.replace(CONTROL_CHARACTERS, " ");
}

/** Columns separated by two spaces, a dashed line under the headers; the last column is not padded. */
export function renderTable(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const cells = [headers, ...rows].map((row) => headers.map((_, index) => toCellText(row[index] ?? "")));
  const widths = headers.map((_, index) => Math.max(...cells.map((row) => [...(row[index] ?? "")].length)));
  const pad = (row: readonly string[]) =>
    row
      .map((cell, index) => (index === row.length - 1 ? cell : cell + " ".repeat((widths[index] ?? 0) - [...cell].length)))
      .join("  ")
      .trimEnd();
  const [head = [], ...body] = cells;
  return [pad(head), pad(widths.map((width) => "-".repeat(width))), ...body.map(pad)].join("\n");
}
