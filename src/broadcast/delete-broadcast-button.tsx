// Deleting one sent broadcast from COCKPIT's history, after a confirmation dialog. The issues the broadcast created in
// the projects stay, and the dialog says so.
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ConfirmDeleteButton } from "../shell/confirm-delete-button.tsx";

export interface DeleteBroadcastButtonProps {
  readonly copy: AppMessages["broadcast"];
  readonly broadcastId: string;
  readonly title: string;
  readonly action: (formData: FormData) => Promise<void>;
}

export function DeleteBroadcastButton({ copy, broadcastId, title, action }: DeleteBroadcastButtonProps) {
  return (
    <ConfirmDeleteButton
      copy={{
        label: fillMessage(copy.deleteLabel, { title }),
        question: copy.deleteQuestion,
        hint: copy.deleteHint,
        delete: copy.delete,
        deleting: copy.deleting,
        cancel: copy.cancel,
      }}
      fields={{ broadcastId }}
      action={action}
    />
  );
}
