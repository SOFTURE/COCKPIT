// A run-wide order as the panel shows it: the label and the plain values `softure-roadmap` writes, in the panel's
// language. A label or value it does not know is shown as written.
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { RoadmapOrder } from "./parse-roadmap.ts";

type Copy = AppMessages["roadmapView"];

export interface DescribedOrder {
  readonly label: string;
  readonly note: string | null;
  readonly text: string;
}

const UP_TO_RE = /^up to (\d+) at once\b/;

function hasOwnKey<T extends object>(record: T, key: string): key is Extract<keyof T, string> {
  return Object.hasOwn(record, key);
}

function translateValue(text: string, copy: Copy): string {
  const upTo = UP_TO_RE.exec(text);
  if (upTo !== null) {
    return fillMessage(copy.orderValues.upTo, { count: upTo[1] ?? "" }) + text.slice(upTo[0].length);
  }
  const phrases: readonly (readonly [RegExp, string])[] = [
    [/^no\b/, copy.orderValues.no],
    [/^at the end\b/, copy.orderValues.atTheEnd],
    [/^after each item\b/, copy.orderValues.afterEachItem],
    // "after OM-8": only before an item ID, so free text after "after" is never half translated.
    [/^after (?=[A-Z]+-\d+\b)/, copy.orderValues.afterItem],
  ];
  for (const [pattern, translated] of phrases) {
    const match = pattern.exec(text);
    if (match !== null) {
      return translated + text.slice(match[0].length);
    }
  }
  return text;
}

export function describeOrder(order: RoadmapOrder, copy: Copy): DescribedOrder {
  const label = hasOwnKey(copy.orderLabels, order.label) ? copy.orderLabels[order.label] : order.label;
  return { label, note: order.note, text: translateValue(order.text, copy) };
}
