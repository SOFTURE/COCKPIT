// Reads a roadmap file as `softure-roadmap` writes it (WORKFLOW §5): the frontmatter, the title, the run-wide orders,
// the at-a-glance table (the contract `context_state.py` parses) and the item blocks (`### ID: title` with
// `- **Field:** value` lines), plus the checkboxes of its owner sections. Tolerant: a part it does not find is empty.

export interface RoadmapOrder {
  readonly label: string;
  readonly text: string;
}

export interface RoadmapRow {
  readonly id: string;
  readonly changeId: string | null;
  readonly outcome: string | null;
  readonly prerequisites: readonly string[];
  readonly mode: string | null;
  readonly status: RoadmapStatus;
}

export interface RoadmapStatus {
  /** The status keyword (`ready`, `in_progress`, `done`, ...); `unknown` when the cell is empty. */
  readonly keyword: string;
  /** The text in the trailing parentheses, if any. */
  readonly detail: string | null;
}

export interface RoadmapField {
  readonly label: string;
  /** The text after the label, continuation lines joined; empty when the field is only a list. */
  readonly text: string;
  /** The nested `- ` lines under the field. */
  readonly list: readonly string[];
}

export interface RoadmapItemBlock {
  readonly id: string;
  readonly title: string;
  readonly fields: readonly RoadmapField[];
}

export interface RoadmapCheck {
  readonly section: string;
  readonly text: string;
  readonly isDone: boolean;
}

export interface ParsedRoadmap {
  readonly frontmatter: Readonly<Record<string, string | null>>;
  readonly title: string | null;
  readonly orders: readonly RoadmapOrder[];
  readonly rows: readonly RoadmapRow[];
  readonly items: readonly RoadmapItemBlock[];
  readonly checks: readonly RoadmapCheck[];
}

const ROW_RE = /^\|\s*\*\*([A-Z]+-\d+)\*\*\s*\|/;
const ID_RE = /\b[A-Z]+-\d+\b/g;
const STATUS_RE = /^(proposed|ready_to_merge|ready|blocked|in_progress|done_code|done|dropped|carried)\b/;
const ITEM_HEADING_RE = /^###\s+\*{0,2}([A-Z]+-\d+)\*{0,2}\s*[:.\-–]\s*(.+?)\s*$/;
const FIELD_RE = /^- \*\*(.+?):\*\*\s*(.*)$/;
const SUB_ITEM_RE = /^\s+[-*] (.+)$/;
const CHECKBOX_RE = /^\s*- \[([ xX])\] (.+)$/;
const ORDER_RE = /^>\s*-\s*([^:]+):\s*(.+)$/;

/**
 * A roadmap's own text without its HTML comments (`<!-- language: pl -->` markers and notes for agents): they are
 * never shown. An unclosed comment runs to the end of the text.
 */
export function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, "").replace(/\s{2,}/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
}

/** The sections whose checkboxes are the owner's open steps and decisions. */
export const CHECK_SECTIONS = ["Before the next release", "Owner decisions and checks"] as const;

function stripQuotes(value: string): string {
  return value.length >= 2 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'") ? value.slice(1, -1) : value;
}

function parseFrontmatter(text: string): Record<string, string | null> {
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  const fields: Record<string, string | null> = {};
  if (match === null) {
    return fields;
  }
  for (const line of (match[1] ?? "").split("\n")) {
    const pair = /^([A-Za-z_][\w-]*):\s*(.*?)\s*$/.exec(line);
    if (pair === null) {
      continue;
    }
    const value = stripQuotes((pair[2] ?? "").trim());
    fields[pair[1] ?? ""] = value === "" || value === "null" || value === "~" ? null : value;
  }
  return fields;
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** `**in_progress** (plan, since 2026-10-01)` -> keyword and the text in the trailing parentheses. */
export function parseStatus(raw: string): RoadmapStatus {
  const text = raw.replaceAll("**", "").trim();
  const keyword = STATUS_RE.exec(text)?.[1] ?? (text === "" ? "unknown" : (text.split(" ")[0] ?? "unknown"));
  const detail = /\((.*)\)\s*$/.exec(text)?.[1]?.trim() ?? null;
  return { keyword, detail: detail === "" ? null : detail };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = stripComments(value ?? "").replace(/^`|`$/g, "").trim();
  return trimmed === "" || trimmed === "—" || trimmed === "-" ? null : trimmed;
}

function parseRows(lines: readonly string[]): RoadmapRow[] {
  const rows: RoadmapRow[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const id = ROW_RE.exec(line)?.[1];
    if (id === undefined || seen.has(id)) {
      continue;
    }
    const cells = splitCells(line);
    if (cells.length < 3) {
      continue;
    }
    seen.add(id);
    rows.push({
      id,
      changeId: emptyToNull(cells[1]),
      outcome: cells.length > 3 ? emptyToNull(cells[2]) : null,
      prerequisites: cells.length > 4 ? (cells[3]?.match(ID_RE) ?? []) : [],
      mode: cells.length > 5 ? emptyToNull(cells[4]) : null,
      status: parseStatus(cells.at(-1) ?? ""),
    });
  }
  return rows;
}

interface FieldDraft {
  label: string;
  text: string;
  list: string[];
}

interface BlockDraft {
  id: string;
  title: string;
  fields: FieldDraft[];
}

function parseItemBlocks(lines: readonly string[]): RoadmapItemBlock[] {
  const blocks: BlockDraft[] = [];
  let block: BlockDraft | null = null;
  for (const line of lines) {
    const heading = ITEM_HEADING_RE.exec(line);
    if (heading !== null) {
      block = { id: heading[1] ?? "", title: stripComments(heading[2] ?? ""), fields: [] };
      blocks.push(block);
      continue;
    }
    if (block === null) {
      continue;
    }
    if (line.startsWith("#")) {
      block = null;
      continue;
    }
    const field = FIELD_RE.exec(line);
    if (field !== null) {
      block.fields.push({ label: (field[1] ?? "").trim(), text: (field[2] ?? "").trim(), list: [] });
      continue;
    }
    const last = block.fields.at(-1);
    if (last === undefined || line.trim() === "" || !/^\s/.test(line)) {
      continue;
    }
    const sub = SUB_ITEM_RE.exec(line);
    if (sub !== null) {
      last.list.push((sub[1] ?? "").trim());
    } else if (last.list.length > 0) {
      last.list[last.list.length - 1] = `${last.list.at(-1) ?? ""} ${line.trim()}`;
    } else {
      last.text = `${last.text} ${line.trim()}`.trim();
    }
  }
  return blocks.map((draft) => ({
    ...draft,
    fields: draft.fields.map((field) => ({ label: field.label, text: stripComments(field.text), list: field.list.map(stripComments).filter((entry) => entry !== "") })),
  }));
}

function parseChecks(lines: readonly string[]): RoadmapCheck[] {
  const checks: RoadmapCheck[] = [];
  let section: string | null = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      section = (CHECK_SECTIONS as readonly string[]).includes(heading) ? heading : null;
      continue;
    }
    const box = section === null ? null : CHECKBOX_RE.exec(line);
    if (section !== null && box !== null) {
      checks.push({ section, text: stripComments(box[2] ?? ""), isDone: box[1] !== " " });
    }
  }
  return checks;
}

export function parseRoadmap(markdown: string): ParsedRoadmap {
  const text = markdown.replaceAll("\r\n", "\n");
  const lines = text.split("\n");
  const titleLine = lines.find((line) => line.startsWith("# "));
  const orders = lines.flatMap((line) => {
    const match = ORDER_RE.exec(line);
    return match === null ? [] : [{ label: (match[1] ?? "").trim(), text: stripComments(match[2] ?? "") }];
  });
  return {
    frontmatter: parseFrontmatter(text),
    title: titleLine === undefined ? null : titleLine.slice(2).trim(),
    orders,
    rows: parseRows(lines),
    items: parseItemBlocks(lines),
    checks: parseChecks(lines),
  };
}
