"use client";

// A Broadcast project row's "More actions" menu (CT-23): the controls that do not stay inline, on CT-22's shared
// `RowActionsMenu`. The Issue opens in a new tab without a referrer, as the inline link does; Retry fire and Retry send
// call the same server actions with the same fields as their inline forms. An item is disabled while its action runs.
import { ExternalLink, RotateCw } from "lucide-react";
import { useTransition } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { RowActionsMenu, type RowAction } from "../shell/row-actions-menu.tsx";

export type SendMenuItem =
  | { readonly kind: "issue"; readonly url: string; readonly number: number }
  | { readonly kind: "retry-fire"; readonly fields: Readonly<Record<string, string>> }
  | { readonly kind: "retry-send"; readonly fields: Readonly<Record<string, string>> };

export type SendMenuCopy = Pick<AppMessages["broadcast"], "moreActionsLabel" | "openIssue" | "retryFire" | "retrySend">;

export interface SendRowMenuProps {
  readonly copy: SendMenuCopy;
  /** The project, for the button's accessible name. */
  readonly name: string;
  readonly items: readonly SendMenuItem[];
  readonly retryFireAction: (formData: FormData) => Promise<void>;
  readonly retrySendAction: (formData: FormData) => Promise<void>;
}

function toFormData(fields: Readonly<Record<string, string>>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

export function SendRowMenu({ copy, name, items, retryFireAction, retrySendAction }: SendRowMenuProps) {
  const [isRetryingFire, startFire] = useTransition();
  const [isRetryingSend, startSend] = useTransition();
  const toAction = (item: SendMenuItem): RowAction => {
    switch (item.kind) {
      case "issue":
        return {
          id: "issue",
          label: fillMessage(copy.openIssue, { number: item.number }),
          icon: ExternalLink,
          onSelect: () => window.open(item.url, "_blank", "noopener,noreferrer"),
        };
      case "retry-fire":
        return {
          id: "retry-fire",
          label: copy.retryFire,
          icon: RotateCw,
          onSelect: () => startFire(() => retryFireAction(toFormData(item.fields))),
          isDisabled: isRetryingFire,
        };
      case "retry-send":
        return {
          id: "retry-send",
          label: copy.retrySend,
          icon: RotateCw,
          onSelect: () => startSend(() => retrySendAction(toFormData(item.fields))),
          isDisabled: isRetryingSend,
        };
    }
  };
  return (
    // Busy while a retry runs: its item is disabled until the page shows the result.
    <span className="contents" aria-busy={isRetryingFire || isRetryingSend} data-send-menu="">
      <RowActionsMenu label={fillMessage(copy.moreActionsLabel, { name })} items={items.map(toAction)} />
    </span>
  );
}
