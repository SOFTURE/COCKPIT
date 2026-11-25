// The tabs of a project's history (CT-21): CI, Quality review, Merges, Releases and Doctor, each a link that keeps the
// shown tab in the address, with how many rows it holds. A block whose read failed shows no count: its tab says why.
import { pickTab, tabHref } from "../../shell/pick-tab.ts";
import type { DoctorFindings, HistoryBlock, ProjectHistory } from "./build-history.ts";

export const HISTORY_TAB_KEYS = ["ci", "quality-review", "merges", "releases", "doctor"] as const;

export type HistoryTabKey = (typeof HISTORY_TAB_KEYS)[number];

export interface HistoryTab {
  readonly key: HistoryTabKey;
  readonly count: number | undefined;
  readonly href: string;
}

export interface HistoryTabsInput {
  readonly history: ProjectHistory;
  /** The history page's path, without a query. */
  readonly basePath: string;
  /** The `tab` query parameter as the address carries it. */
  readonly requested: string | undefined;
}

function countBlock<T>(block: HistoryBlock<T>, count: (value: T) => number | undefined): number | undefined {
  return block.status === "ok" ? count(block.value) : undefined;
}

function countDoctor(doctor: DoctorFindings): number | undefined {
  return doctor.kind === "failing" ? (doctor.total ?? doctor.findings.length) : undefined;
}

export function buildHistoryTabs({ history, basePath, requested }: HistoryTabsInput): { readonly tabs: readonly HistoryTab[]; readonly current: HistoryTabKey } {
  const counts: Readonly<Record<HistoryTabKey, number | undefined>> = {
    ci: countBlock(history.runs, (runs) => runs.ci.length),
    "quality-review": countBlock(history.runs, (runs) => runs.qualityReview.length),
    merges: countBlock(history.merges, (merges) => merges.length),
    releases: countBlock(history.releases, (releases) => releases.length),
    doctor: countBlock(history.doctor, countDoctor),
  };
  return {
    tabs: HISTORY_TAB_KEYS.map((key) => ({ key, count: counts[key], href: tabHref(basePath, key) })),
    current: pickTab(HISTORY_TAB_KEYS, requested, "ci"),
  };
}
