"use client";

// A Broadcast project row's "More actions" menu (CT-23, CT-27): the controls that do not stay inline, on theme-notion's
// `RowActionsMenu`, rendered straight into `ListEntry`'s `menu` slot (the slot sizes its direct child for touch). The
// Issue opens in a new tab without a referrer, as the inline link does; Retry fire and Retry send call the same server
// actions with the same fields as their inline forms. An item is disabled while its action runs.
import { RowActionsMenu, type RowMenuAction } from "@softure-ai/theme-notion";
import { ExternalLink, RotateCw } from "lucide-react";
import { useTransition } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";

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

export interface SendMenuHandlers {
  readonly openIssue: (url: string) => void;
  readonly retryFire: (fields: Readonly<Record<string, string>>) => void;
  readonly retrySend: (fields: Readonly<Record<string, string>>) => void;
  readonly isRetryingFire: boolean;
  readonly isRetryingSend: boolean;
}

function toFormData(fields: Readonly<Record<string, string>>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

/** The menu's actions in the given order, each bound to its handler, a retry disabled while it runs. */
export function buildSendMenuActions(copy: SendMenuCopy, items: readonly SendMenuItem[], handlers: SendMenuHandlers): RowMenuAction[] {
  return items.map((item): RowMenuAction => {
    switch (item.kind) {
      case "issue":
        return {
          id: "issue",
          label: fillMessage(copy.openIssue, { number: item.number }),
          icon: <ExternalLink aria-hidden="true" />,
          onSelect: () => handlers.openIssue(item.url),
        };
      case "retry-fire":
        return {
          id: "retry-fire",
          label: copy.retryFire,
          icon: <RotateCw aria-hidden="true" />,
          onSelect: () => handlers.retryFire(item.fields),
          isDisabled: handlers.isRetryingFire,
        };
      case "retry-send":
        return {
          id: "retry-send",
          label: copy.retrySend,
          icon: <RotateCw aria-hidden="true" />,
          onSelect: () => handlers.retrySend(item.fields),
          isDisabled: handlers.isRetryingSend,
        };
    }
  });
}

export function SendRowMenu({ copy, name, items, retryFireAction, retrySendAction }: SendRowMenuProps) {
  const [isRetryingFire, startFire] = useTransition();
  const [isRetryingSend, startSend] = useTransition();
  const actions = buildSendMenuActions(copy, items, {
    openIssue: (url) => window.open(url, "_blank", "noopener,noreferrer"),
    retryFire: (fields) => startFire(() => retryFireAction(toFormData(fields))),
    retrySend: (fields) => startSend(() => retrySendAction(toFormData(fields))),
    isRetryingFire,
    isRetryingSend,
  });
  return <RowActionsMenu label={fillMessage(copy.moreActionsLabel, { name })} actions={actions} />;
}
