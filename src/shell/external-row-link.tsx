// The title link of a list row that opens a page outside COCKPIT (a pull request, a release, a run): the theme's
// `ListEntry` takes it as `linkComponent`, so the stretched link opens a new tab without a referrer.
import type { ComponentProps } from "react";

export function ExternalRowLink(props: Omit<ComponentProps<"a">, "rel" | "target">) {
  return <a {...props} rel="noreferrer" target="_blank" />;
}
