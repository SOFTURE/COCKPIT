// What wakes a project on an owner-word issue, as a property chip (CV-2): on its own (the wake routine), while a run
// works (the heartbeat), or at its next run; unknown with the reason. A project without a workflow file shows nothing.
import { Badge, Button } from "@softure-ai/theme-notion";
import { ExternalLink } from "lucide-react";
import type { AppMessages } from "../../../messages/index.ts";
import { SectionCard } from "../../shell/section-card.tsx";
import { WAKE_SETUP_URL } from "./owner-word-wake.ts";
import type { WakeView } from "./wake-view.ts";

type Copy = AppMessages["wake"];
type ShownWake = Exclude<WakeView, { kind: "none" }>;

function describeWake(copy: Copy, wake: ShownWake): { readonly text: string; readonly hint: string } {
  if (wake.kind === "unknown") {
    return { text: copy.unknown, hint: copy.unknownReasons[wake.reason] };
  }
  return { text: copy.states[wake.wake], hint: copy.hints[wake.wake] };
}

function getDataValue(wake: ShownWake): string {
  return wake.kind === "unknown" ? "unknown" : wake.wake;
}

export function WakeChip({ wake, copy }: { readonly wake: WakeView; readonly copy: Copy }) {
  if (wake.kind === "none") {
    return null;
  }
  const { text, hint } = describeWake(copy, wake);
  const isRoutine = wake.kind === "declared" && wake.wake === "routine";
  return (
    <Badge variant="tag" color={isRoutine ? "green" : "gray"} title={hint} className="max-w-full truncate" data-wake={getDataValue(wake)}>
      {text}
    </Badge>
  );
}

/** The wake-up as a card of the project page: the chip, its explanation and, unless the routine is declared, the setup link. */
export function WakeDetails({ wake, copy }: { readonly wake: WakeView; readonly copy: Copy }) {
  if (wake.kind === "none") {
    return null;
  }
  const { hint } = describeWake(copy, wake);
  const isRoutine = wake.kind === "declared" && wake.wake === "routine";
  return (
    <SectionCard id="owner-word-wake" title={copy.label} description={hint}>
      <div className="flex min-w-0 flex-wrap items-center gap-3" data-wake-details={getDataValue(wake)}>
        <WakeChip wake={wake} copy={copy} />
        {isRoutine ? null : (
          <Button asChild variant="outline" size="touch" className="md:h-7 md:px-2.5">
            <a href={WAKE_SETUP_URL} rel="noreferrer" target="_blank">
              <ExternalLink aria-hidden="true" />
              {copy.setup}
            </a>
          </Button>
        )}
      </div>
    </SectionCard>
  );
}
