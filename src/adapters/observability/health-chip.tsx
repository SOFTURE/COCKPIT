// A project's health as a property chip (FR-17): healthy, unhealthy with the number of firing alerts (their titles
// in the hint), or unknown with the reason. A project without a health source shows nothing.
import { Badge } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import type { HealthView } from "./health-view.ts";

type Copy = AppMessages["health"];

function describeHealth(copy: Copy, health: Exclude<HealthView, { kind: "none" }>): { readonly text: string; readonly hint: string } {
  switch (health.kind) {
    case "healthy":
      return { text: copy.healthy, hint: fillMessage(copy.healthyHint, { count: health.rules }) };
    case "unhealthy":
      return {
        text: health.firing.length === 1 ? copy.unhealthyOne : fillMessage(copy.unhealthy, { count: health.firing.length }),
        hint: health.firing.join(", "),
      };
    case "unknown":
      return { text: copy.unknown, hint: copy.unknownReasons[health.reason] };
  }
}

export function HealthChip({ health, copy }: { readonly health: HealthView; readonly copy: Copy }) {
  if (health.kind === "none") {
    return null;
  }
  const { text, hint } = describeHealth(copy, health);
  return (
    <Badge variant="tag" color={health.kind === "unhealthy" ? "red" : "gray"} title={hint} className="max-w-full truncate" data-health={health.kind}>
      {text}
    </Badge>
  );
}

/** The health with its explanation in words, for the project page where there is room for it. */
export function HealthDetails({ health, copy }: { readonly health: HealthView; readonly copy: Copy }) {
  if (health.kind === "none") {
    return null;
  }
  const { hint } = describeHealth(copy, health);
  return (
    <section aria-label={copy.label} className="grid gap-1" data-health-details={health.kind}>
      <h2 className="text-ui font-semibold">{copy.label}</h2>
      <div>
        <HealthChip health={health} copy={copy} />
      </div>
      <p className="text-small text-muted-foreground">{hint}</p>
    </section>
  );
}
