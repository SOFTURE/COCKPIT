// Context drift on screen (CT-3): one orange result badge (needs attention) per drift on an overview row, with the detail and the settle step
// as its hint, and a notice on the project page that names each drift and what settles it. Orange, not red: drift
// is a chore the project's session settles, not a failure.
import { Code, Status } from "@softure-ai/theme-notion";
import { GitCompareArrows } from "lucide-react";
import type { AppMessages } from "../../messages/index.ts";
import { ResultBadge } from "@softure-ai/theme-notion";
import { describeDrift } from "./describe-drift.ts";
import type { ContextDrift } from "./find-context-drift.ts";

type Copy = AppMessages["drift"];

export function DriftChips({ drift, copy }: { readonly drift: readonly ContextDrift[]; readonly copy: Copy }) {
  return drift.map((one) => {
    const text = describeDrift(copy, one);
    return (
      <ResultBadge key={one.kind} tone="warning" icon={GitCompareArrows} title={`${text.detail} ${copy.settleLabel} ${text.fix}`} data-drift={one.kind}>
        {text.title}
      </ResultBadge>
    );
  });
}

export function DriftNotice({ drift, copy }: { readonly drift: readonly ContextDrift[]; readonly copy: Copy }) {
  if (drift.length === 0) {
    return null;
  }
  return (
    <section aria-label={copy.noticeTitle} className="grid gap-2 rounded-lg border border-border bg-card p-4" data-drift-notice="">
      <Status color="orange" icon={GitCompareArrows}>
        {copy.noticeTitle}
      </Status>
      <ul className="grid gap-2">
        {drift.map((one) => {
          const text = describeDrift(copy, one);
          return (
            <li key={one.kind} className="grid gap-0.5 text-small" data-drift={one.kind}>
              <span className="font-medium">{text.title}</span>
              <span className="text-muted-foreground">{text.detail}</span>
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">{copy.settleLabel}</span>
                <Code className="max-w-full break-all">{text.fix}</Code>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-small text-muted-foreground">{copy.noticeHint}</p>
    </section>
  );
}
